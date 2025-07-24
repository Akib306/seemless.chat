import { createClient } from "../supabase/server";
import { createDbUtils } from "./core";

// Factory function for server-side utilities
export async function createServerDb() {
  const supabase = await createClient();
  return createDbUtils(supabase);
}

// Or if you prefer individual exports for backward compatibility:
export async function createChat(userId: string, title: string) {
  const db = await createServerDb();
  return db.chats.createChat(title, userId);
}

export async function getChats(userId: string) {
  const db = await createServerDb();
  return db.chats.getChats(userId);
}

// ... other functions