export type ItemKind = "photo" | "video" | "audio" | "file";
export type ItemSource = "media" | "folder" | "demo";

export type CleanItem = {
  id: string;
  name: string;
  size: number;
  uri: string;
  kind: ItemKind;
  source: ItemSource;
  modified: number; // ms epoch
  preview?: string | number; // image source for thumbnails
  assetId?: string;
  width?: number;
  height?: number;
  hash?: string; // precomputed (demo)
};

export type DupGroup = {
  key: string;
  items: CleanItem[]; // keeper first
  wasted: number;
};

export type PermState = "granted" | "denied" | "blocked" | "undetermined" | "unavailable";

export type Suggestion = {
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
  item_ids: string[];
  bytes: number;
};

export type AiResult = {
  id: string;
  summary: string;
  suggestions: Suggestion[];
  file_count: number;
  created_at: string;
};
