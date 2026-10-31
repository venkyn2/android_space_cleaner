// Keep in sync with PRIVACY_HTML in /app/backend/server.py (hosted copy for Google Play).
export const PRIVACY_UPDATED = "October 31, 2026";

export const PRIVACY_SECTIONS = [
  {
    title: "Your files stay on your phone",
    body: "Scanning, duplicate checks, large-file detection, previews and deletion all happen on your device. Your photos, videos, music and documents are never uploaded, copied or shared.",
  },
  {
    title: "Smart AI helper (optional)",
    body: "Only when you tap \"Suggest what to delete\", the app sends file details (names, sizes, types and ages) to our server and to our AI provider (Anthropic Claude) to create suggestions. File contents are never sent. The suggestions are kept on our server without any account or device identifier.",
  },
  {
    title: "No accounts, ads or tracking",
    body: "Phone Cleaner is free. There are no accounts, no ads, no analytics or tracking tools, and we never sell or share your data.",
  },
  {
    title: "Permissions",
    body: "Photos, Videos and Audio access is used only to find duplicate and large files. Folder access applies only to folders you pick yourself. You can revoke access anytime in Android Settings.",
  },
  {
    title: "Deleting files",
    body: "Nothing is deleted without your review and confirmation. Deleted files are removed permanently from your phone.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Contact the developer through the Google Play store listing.",
  },
];
