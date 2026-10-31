import * as ML from "expo-media-library/legacy";
import { Directory, File, Paths } from "expo-file-system";

import type { CleanItem, ItemKind, PermState } from "./types";

const GRANULAR: ML.GranularPermission[] = ["photo", "video", "audio"];
const MAX_MEDIA = 3000;
const MAX_FILES = 3000;
const HASH_LIMIT = 300 * 1024 * 1024;
const MAX_HASH = 1500;

type Progress = (done: number, label: string) => void;
const tick = () => new Promise((r) => setTimeout(r, 0));

function toState(r: ML.PermissionResponse): PermState {
  if (r.granted) return "granted";
  if (r.status === "undetermined") return "undetermined";
  return r.canAskAgain ? "denied" : "blocked";
}

export async function getMediaPermission(): Promise<PermState> {
  try {
    return toState(await ML.getPermissionsAsync(false, GRANULAR));
  } catch {
    return "unavailable";
  }
}

export async function requestMediaPermission(): Promise<PermState> {
  try {
    return toState(await ML.requestPermissionsAsync(false, GRANULAR));
  } catch {
    return "unavailable";
  }
}

function fileSize(uri: string): number {
  try {
    return new File(uri).size || 0;
  } catch {
    return 0;
  }
}

export async function scanMedia(onProgress: Progress): Promise<CleanItem[]> {
  const out: CleanItem[] = [];
  let after: string | undefined;
  let hasNext = true;
  while (hasNext && out.length < MAX_MEDIA) {
    const page = await ML.getAssetsAsync({
      first: 200,
      after,
      mediaType: [ML.MediaType.photo, ML.MediaType.video, ML.MediaType.audio],
      sortBy: [[ML.SortBy.creationTime, false]],
    });
    for (const a of page.assets) {
      const kind: ItemKind = a.mediaType === "photo" ? "photo" : a.mediaType === "video" ? "video" : "audio";
      out.push({
        id: `m_${a.id}`,
        assetId: a.id,
        name: a.filename,
        uri: a.uri,
        preview: kind === "photo" ? a.uri : undefined,
        size: fileSize(a.uri),
        kind,
        source: "media",
        modified: a.modificationTime || a.creationTime,
        width: a.width,
        height: a.height,
      });
    }
    onProgress(out.length, "Reading photos & videos");
    after = page.endCursor;
    hasNext = page.hasNextPage;
    await tick();
  }
  // Some URIs can't be sized directly; resolve the local path.
  for (const it of out.filter((i) => !i.size).slice(0, 500)) {
    try {
      const info = await ML.getAssetInfoAsync(it.assetId!);
      if (info.localUri) {
        it.size = fileSize(info.localUri);
        it.uri = info.localUri;
      }
    } catch {
      // keep size 0
    }
  }
  return out;
}

function kindFromName(name: string): ItemKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "heic", "webp", "gif"].includes(ext)) return "photo";
  if (["mp4", "mov", "mkv", "3gp", "webm", "avi"].includes(ext)) return "video";
  if (["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac"].includes(ext)) return "audio";
  return "file";
}

async function walk(dir: Directory, depth: number, out: CleanItem[], onProgress: Progress) {
  if (depth > 6 || out.length >= MAX_FILES) return;
  let entries: (Directory | File)[] = [];
  try {
    entries = dir.list();
  } catch {
    return;
  }
  for (const e of entries) {
    if (out.length >= MAX_FILES) return;
    if (e instanceof Directory) {
      await walk(e, depth + 1, out, onProgress);
    } else {
      const name = e.name || decodeURIComponent(e.uri.split("/").pop() ?? "file");
      const kind = kindFromName(name);
      let size = 0;
      let modified = Date.now();
      try {
        size = e.size || 0;
        modified = e.lastModified ?? modified;
      } catch {
        // unreadable
      }
      out.push({
        id: `f_${e.uri}`,
        name,
        uri: e.uri,
        size,
        kind,
        source: "folder",
        modified,
        preview: kind === "photo" ? e.uri : undefined,
      });
    }
  }
  onProgress(out.length, "Reading folder files");
  await tick();
}

export async function pickAndScanFolder(onProgress: Progress): Promise<CleanItem[]> {
  const dir = await Directory.pickDirectoryAsync();
  const out: CleanItem[] = [];
  await walk(dir, 0, out, onProgress);
  return out;
}

/** Returns id -> duplicate key. Candidates are matched by size, then confirmed by MD5 when possible. */
export async function duplicateKeys(items: CleanItem[], onProgress: Progress): Promise<Record<string, string>> {
  const bySize = new Map<number, CleanItem[]>();
  for (const it of items) {
    if (it.size <= 0) continue;
    const arr = bySize.get(it.size) ?? [];
    arr.push(it);
    bySize.set(it.size, arr);
  }
  const keys: Record<string, string> = {};
  let done = 0;
  for (const group of bySize.values()) {
    if (group.length < 2) continue;
    for (const it of group) {
      let h = it.hash;
      if (!h && it.source !== "demo" && it.size <= HASH_LIMIT && done < MAX_HASH) {
        try {
          h = await new File(it.uri).digest("MD5");
        } catch {
          h = undefined;
        }
      }
      done++;
      // Only exact content matches count as duplicates; unverified same-size files are skipped for safety.
      if (h) keys[it.id] = `${it.size}:${h}`;
      if (done % 10 === 0) {
        onProgress(done, "Comparing similar files");
        await tick();
      }
    }
  }
  return keys;
}

/** Deletes items; returns ids that were removed. */
export async function deleteItems(items: CleanItem[]): Promise<string[]> {
  const deleted: string[] = [];
  const media = items.filter((i) => i.source === "media" && i.assetId);
  if (media.length) {
    const ok = await ML.deleteAssetsAsync(media.map((m) => m.assetId!));
    if (ok) deleted.push(...media.map((m) => m.id));
  }
  for (const f of items.filter((i) => i.source === "folder")) {
    try {
      new File(f.uri).delete();
      deleted.push(f.id);
    } catch {
      // skip files we can't delete
    }
  }
  deleted.push(...items.filter((i) => i.source === "demo").map((i) => i.id));
  return deleted;
}

export function diskInfo(): { total: number; free: number } | null {
  try {
    const total = Paths.totalDiskSpace;
    const free = Paths.availableDiskSpace;
    return total ? { total, free } : null;
  } catch {
    return null;
  }
}
