// Notion util (no-op if no token)
export async function syncToNotion() {
  if (!process.env.NOTION_TOKEN) return;
  // Implement Notion sync if needed
}
