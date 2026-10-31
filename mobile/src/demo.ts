import type { CleanItem } from "./types";
import { MB } from "./format";

const beach = require("../assets/images/demo_beach.jpg");
const dog = require("../assets/images/demo_dog.jpg");
const food = require("../assets/images/demo_food.jpg");
const shot = require("../assets/images/demo_screenshot.jpg");

const DAY = 86400000;
const now = Date.now();

type Seed = [string, number, CleanItem["kind"], number, (number | undefined)?, string?];

// [name, sizeBytes, kind, ageDays, preview, hash]
const seeds: Seed[] = [
  ["IMG_20240612_101522.jpg", 4.2 * MB, "photo", 410, beach, "beach"],
  ["IMG_20240612_101522(1).jpg", 4.2 * MB, "photo", 300, beach, "beach"],
  ["WhatsApp Image 2024-06-12.jpg", 4.2 * MB, "photo", 290, beach, "beach"],
  ["IMG_20250301_160244.jpg", 5.1 * MB, "photo", 190, dog, "dog"],
  ["IMG_20250301_160244_copy.jpg", 5.1 * MB, "photo", 120, dog, "dog"],
  ["IMG_20250815_131010.jpg", 3.6 * MB, "photo", 45, food, "food"],
  ["Snapchat-1823311.jpg", 3.6 * MB, "photo", 40, food, "food"],
  ["Screenshot_20240101-090011.png", 1.1 * MB, "photo", 620, shot, "s1"],
  ["Screenshot_20240101-090011(1).png", 1.1 * MB, "photo", 620, shot, "s1"],
  ["Screenshot_20240322-212201.png", 0.9 * MB, "photo", 540, shot, "s2"],
  ["Screenshot_20240518-075432.png", 1.3 * MB, "photo", 480, shot, "s3"],
  ["VID_20231224_183000.mp4", 1240 * MB, "video", 640, undefined, "v1"],
  ["VID_20240704_210512.mp4", 620 * MB, "video", 450, undefined, "v2"],
  ["VID_20250210_120044.mp4", 340 * MB, "video", 230, undefined, "v3"],
  ["WhatsApp Video 2025-02-14.mp4", 86 * MB, "video", 220, undefined, "wv"],
  ["WhatsApp Video 2025-02-14(1).mp4", 86 * MB, "video", 210, undefined, "wv"],
  ["Movie_backup.mkv", 2150 * MB, "file", 800, undefined, "mkv"],
  ["app-release-v2.apk", 152 * MB, "file", 365, undefined, "apk"],
  ["Podcast_Episode_112.mp3", 64 * MB, "audio", 200, undefined, "pod"],
  ["Voice note 2024-11-02.m4a", 2.4 * MB, "audio", 330, undefined, "vn"],
  ["Invoice_March.pdf", 1.8 * MB, "file", 210, undefined, "inv"],
  ["Invoice_March (1).pdf", 1.8 * MB, "file", 200, undefined, "inv"],
  ["Offline_Maps_Europe.zip", 980 * MB, "file", 500, undefined, "map"],
  ["Concert_4K.mov", 512 * MB, "video", 90, undefined, "c4k"],
];

export function demoItems(): CleanItem[] {
  return seeds.map(([name, size, kind, age, preview, hash], i) => ({
    id: `demo_${i}`,
    name,
    size: Math.round(size),
    uri: `demo://${name}`,
    kind,
    source: "demo" as const,
    modified: now - age * DAY,
    preview,
    hash,
  }));
}

export const DEMO_DISK = { total: 128 * 1024 * MB, free: Math.round(9.6 * 1024 * MB) };
