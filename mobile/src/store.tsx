import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { storage } from "@/src/utils/storage";
import * as scanner from "./scanner";
import { DEMO_DISK, demoItems } from "./demo";
import { MB } from "./format";
import type { CleanItem, DupGroup, PermState } from "./types";

type Status = "idle" | "scanning" | "done" | "error";
type Mode = "none" | "device" | "demo";

type Ctx = {
  items: CleanItem[];
  status: Status;
  mode: Mode;
  progress: { done: number; label: string };
  error: string | null;
  permission: PermState;
  disk: { total: number; free: number } | null;
  thresholdMB: number;
  setThresholdMB: (v: number) => void;
  groups: DupGroup[];
  dupWasted: number;
  largeFiles: CleanItem[];
  largeBytes: number;
  selected: Set<string>;
  selectedItems: CleanItem[];
  selectedBytes: number;
  toggle: (id: string) => void;
  selectMany: (ids: string[], on?: boolean) => void;
  clearSelection: () => void;
  refreshPermission: () => Promise<PermState>;
  requestPermission: () => Promise<PermState>;
  scanDevice: () => Promise<void>;
  scanFolder: () => Promise<void>;
  loadDemo: () => void;
  deleteSelected: () => Promise<{ count: number; bytes: number }>;
  keeperIds: Set<string>;
  dupKeyOf: Record<string, string>;
};

const StoreContext = createContext<Ctx | null>(null);
const THRESHOLD_KEY = "large_threshold_mb";
const isWeb = Platform.OS === "web";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CleanItem[]>([]);
  const [dupKeyOf, setDupKeyOf] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("none");
  const [progress, setProgress] = useState({ done: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermState>(isWeb ? "unavailable" : "undetermined");
  const [disk, setDisk] = useState<{ total: number; free: number } | null>(null);
  const [thresholdMB, setThreshold] = useState(50);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const busy = useRef(false);

  useEffect(() => {
    storage.getItem(THRESHOLD_KEY, 50).then((v) => typeof v === "number" && setThreshold(v));
    if (!isWeb) {
      setDisk(scanner.diskInfo());
      scanner.getMediaPermission().then(setPermission);
    }
  }, []);

  const setThresholdMB = useCallback((v: number) => {
    setThreshold(v);
    storage.setItem(THRESHOLD_KEY, v);
  }, []);

  const onProgress = useCallback((done: number, label: string) => setProgress({ done, label }), []);

  const finishScan = useCallback(
    async (list: CleanItem[], m: Mode) => {
      const keys = await scanner.duplicateKeys(list, onProgress);
      setItems(list);
      setDupKeyOf(keys);
      setSelected(new Set());
      setMode(m);
      setStatus("done");
    },
    [onProgress],
  );

  const refreshPermission = useCallback(async () => {
    const p = await scanner.getMediaPermission();
    setPermission(p);
    return p;
  }, []);

  const requestPermission = useCallback(async () => {
    const p = await scanner.requestMediaPermission();
    setPermission(p);
    return p;
  }, []);

  const scanDevice = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus("scanning");
    setError(null);
    setProgress({ done: 0, label: "Starting scan" });
    try {
      const media = await scanner.scanMedia(onProgress);
      setDisk(scanner.diskInfo());
      await finishScan(media, "device");
    } catch (e: any) {
      setError(e?.message ? `Couldn't read your media library. ${e.message}` : "Couldn't read your media library.");
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }, [finishScan, onProgress]);

  const scanFolder = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    try {
      setProgress({ done: 0, label: "Pick a folder" });
      const files = await scanner.pickAndScanFolder((d, l) => {
        setStatus("scanning");
        onProgress(d, l);
      });
      setStatus("scanning");
      const base = mode === "device" ? items.filter((i) => i.source === "media") : [];
      const existing = new Set(base.map((i) => i.id));
      await finishScan([...base, ...files.filter((f) => !existing.has(f.id))], "device");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (/cancel/i.test(msg)) {
        setStatus(items.length ? "done" : "idle");
      } else {
        setError(`Couldn't read that folder. ${msg}`);
        setStatus("error");
      }
    } finally {
      busy.current = false;
    }
  }, [finishScan, items, mode, onProgress]);

  const loadDemo = useCallback(() => {
    setStatus("scanning");
    setError(null);
    setProgress({ done: 0, label: "Loading demo data" });
    setDisk(DEMO_DISK);
    setTimeout(() => finishScan(demoItems(), "demo"), 600);
  }, [finishScan]);

  const groups = useMemo<DupGroup[]>(() => {
    const map = new Map<string, CleanItem[]>();
    for (const it of items) {
      const k = dupKeyOf[it.id];
      if (!k) continue;
      const arr = map.get(k) ?? [];
      arr.push(it);
      map.set(k, arr);
    }
    const out: DupGroup[] = [];
    for (const [key, arr] of map) {
      if (arr.length < 2) continue;
      const sorted = [...arr].sort((a, b) => a.modified - b.modified); // oldest = original keeper
      out.push({ key, items: sorted, wasted: sorted.slice(1).reduce((s, i) => s + i.size, 0) });
    }
    return out.sort((a, b) => b.wasted - a.wasted);
  }, [items, dupKeyOf]);

  const keeperIds = useMemo(() => new Set(groups.map((g) => g.items[0].id)), [groups]);
  const dupWasted = useMemo(() => groups.reduce((s, g) => s + g.wasted, 0), [groups]);
  const largeFiles = useMemo(
    () => items.filter((i) => i.size >= thresholdMB * MB).sort((a, b) => b.size - a.size),
    [items, thresholdMB],
  );
  const largeBytes = useMemo(() => largeFiles.reduce((s, i) => s + i.size, 0), [largeFiles]);
  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
  const selectedBytes = useMemo(() => selectedItems.reduce((s, i) => s + i.size, 0), [selectedItems]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectMany = useCallback((ids: string[], on = true) => {
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const deleteSelected = useCallback(async () => {
    const target = items.filter((i) => selected.has(i.id));
    const deleted = new Set(await scanner.deleteItems(target));
    const bytes = target.filter((i) => deleted.has(i.id)).reduce((s, i) => s + i.size, 0);
    if (deleted.size) {
      setItems((prev) => prev.filter((i) => !deleted.has(i.id)));
      setSelected((prev) => new Set([...prev].filter((id) => !deleted.has(id))));
      setDisk((d) => (d ? { ...d, free: d.free + bytes } : d));
      if (mode === "device") setTimeout(() => setDisk((d) => scanner.diskInfo() ?? d), 1500);
    }
    return { count: deleted.size, bytes };
  }, [items, selected, mode]);

  const value: Ctx = {
    items,
    status,
    mode,
    progress,
    error,
    permission,
    disk,
    thresholdMB,
    setThresholdMB,
    groups,
    dupWasted,
    largeFiles,
    largeBytes,
    selected,
    selectedItems,
    selectedBytes,
    toggle,
    selectMany,
    clearSelection,
    refreshPermission,
    requestPermission,
    scanDevice,
    scanFolder,
    loadDemo,
    deleteSelected,
    keeperIds,
    dupKeyOf,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
