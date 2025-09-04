import { Tables, TablesInsert, TablesUpdate } from "./supabase";

// Database table types (Row)
export type Message = Tables<"messages">;
export type Chat = Tables<"chats">;
export type MessagePart = Tables<"message_parts">;
export type Profile = Tables<"profiles">;
export type ApiUsage = Tables<"api_usage">;
export type Subscription = Tables<"subscriptions">;
export type UsageSummary = Tables<"usage_summaries">;

// Insert types (for creating new records)
export type MessageInsert = TablesInsert<"messages">;
export type ChatInsert = TablesInsert<"chats">;
export type MessagePartInsert = TablesInsert<"message_parts">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ApiUsageInsert = TablesInsert<"api_usage">;
export type SubscriptionInsert = TablesInsert<"subscriptions">;
export type UsageSummaryInsert = TablesInsert<"usage_summaries">;

// Update types (for updating existing records)
export type MessageUpdate = TablesUpdate<"messages">;
export type ChatUpdate = TablesUpdate<"chats">;
export type MessagePartUpdate = TablesUpdate<"message_parts">;
export type ProfileUpdate = TablesUpdate<"profiles">;
export type ApiUsageUpdate = TablesUpdate<"api_usage">;
export type SubscriptionUpdate = TablesUpdate<"subscriptions">;
export type UsageSummaryUpdate = TablesUpdate<"usage_summaries">;
