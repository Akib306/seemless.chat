import { ApiUsage } from "@/types/db";
import { createClient } from "../supabase/server";


/**
 * Log API usage for tracking and billing purposes
 */
export async function logApiUsage({
  user_id,
  chat_id,
  endpoint,
  model,
  prompt_tokens,
  completion_tokens,
  total_tokens,
}: ApiUsage) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("api_usage").insert({
    user_id,
    chat_id,
    endpoint,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens,
  });

  if (error) throw error;
  return data;
}
