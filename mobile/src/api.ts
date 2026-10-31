import { ageDays } from "./format";
import type { AiResult, CleanItem, DupGroup } from "./types";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function fetchSuggestions(
  items: CleanItem[],
  groups: DupGroup[],
  disk: { total: number; free: number } | null,
): Promise<AiResult> {
  const groupOf: Record<string, { key: string; keeper: boolean }> = {};
  groups.forEach((g, gi) =>
    g.items.forEach((it, idx) => (groupOf[it.id] = { key: `g${gi + 1}`, keeper: idx === 0 })),
  );
  // Only metadata is sent: names, sizes, kinds and ages. Never file content.
  const dupItems = items.filter((i) => groupOf[i.id]);
  const largest = [...items].sort((a, b) => b.size - a.size).slice(0, 120);
  const screenshots = items.filter((i) => /screenshot/i.test(i.name)).slice(0, 40);
  const pool = new Map<string, CleanItem>();
  [...dupItems, ...largest, ...screenshots].forEach((i) => pool.set(i.id, i));

  const files = [...pool.values()].slice(0, 200).map((i) => ({
    id: i.id,
    name: i.name,
    size: i.size,
    kind: i.kind,
    age_days: ageDays(i.modified),
    dup_group: groupOf[i.id]?.key,
    is_keeper: groupOf[i.id]?.keeper ?? false,
  }));

  const res = await fetch(`${BASE}/api/ai/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files,
      free_bytes: disk ? Math.round(disk.free) : undefined,
      total_bytes: disk ? Math.round(disk.total) : undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body?.detail === "string" ? body.detail : null;
    throw new Error(detail ?? `AI helper request failed (${res.status}). Please try again.`);
  }
  return res.json();
}
