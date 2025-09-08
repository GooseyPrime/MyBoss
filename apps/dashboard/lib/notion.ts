// Notion util (no-op if no token)
export async function syncToNotion(data: any) {
  if (!process.env.NOTION_TOKEN) return;
  // Implement Notion sync if needed
}
