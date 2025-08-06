import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chat, Message, Profile } from "@/types/db";

// Core utilities that work with any Supabase client
export function createDbUtils(supabase: SupabaseClient, getUserId?: () => Promise<string>) {
  
  // ===== PROFILES =====
  const profiles = {
    async getProfile(userId?: string): Promise<Profile> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(`Failed to get profile: ${error.message}`);
      return data;
    },

    async updateProfile(updates: { username?: string }, userId?: string): Promise<Profile> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to update profile: ${error.message}`);
      return data;
    },

    async createProfile(userId: string): Promise<any> {
      const { data, error } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("*")
        .single();

      if (error) throw new Error(`Failed to create profile: ${error.message}`);
      return data;
    },
  };

  // ===== CHATS =====
  const chats = {
    async createChat(title: string, userId?: string): Promise<Chat> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("chats")
        .insert({
          title,
          user_id: id,
        })
        .select("*")
        .single();

      if (error) throw new Error(`Failed to create chat: ${error.message}`);
      if (!data) throw new Error("Chat creation returned no data");
      return data;
    },

    async getChats(userId?: string): Promise<Chat[]> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", id)
        .order("updated_at", { ascending: false });

      if (error) throw new Error(`Failed to fetch chats: ${error.message}`);
      return data || [];
    },

    async getChat(chatId: string): Promise<Chat> {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (error) throw new Error(`Failed to get chat: ${error.message}`);
      if (!data) throw new Error(`Chat ${chatId} not found`);
      return data;
    },

    async updateChatTitle(chatId: string, title: string): Promise<Chat> {
      const { data, error } = await supabase
        .from("chats")
        .update({ title })
        .eq("id", chatId)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to update chat title: ${error.message}`);
      return data;
    },

    async deleteChat(chatId: string): Promise<boolean> {
      const { error } = await supabase.from("chats").delete().eq("id", chatId);
      if (error) throw new Error(`Failed to delete chat: ${error.message}`);
      return true;
    },

    async getChatTitle(chatId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from("chats")
        .select("title")
        .eq("id", chatId)
        .single();

      if (error) throw new Error(`Failed to fetch chat title: ${error.message}`);
      return data?.title || null;
    },

    async pinChat(chatId: string): Promise<Chat> {
      const { data, error } = await supabase
        .from("chats")
        .update({ pinned_at: new Date().toISOString() })
        .eq("id", chatId)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to pin chat: ${error.message}`);
        return data;
    },

    async unpinChat(chatId: string): Promise<Chat> {
      const { data, error } = await supabase
        .from("chats")
        .update({ pinned_at: null })
        .eq("id", chatId)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to unpin chat: ${error.message}`);
      return data;
    },
  };

  // ===== MESSAGES =====
  const messages = {
    async createMessage(
      chatId: string,
      content: string,
      role: "user" | "assistant",
      modelUsed?: string,
      userId?: string,
    ): Promise<Message> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          user_id: id,
          content,
          role,
          model_used: modelUsed,
        })
        .select("*")
        .single();

      if (error) throw new Error(`Failed to create message: ${error.message}`);
      if (!data) throw new Error("Message creation returned no data");
      return data;
    },

    async getMessagesByChatId(chatId: string): Promise<Message[]> {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async updateMessage(messageId: string, newContent: string): Promise<Message[]> {
      const { data, error } = await supabase
        .from("messages")
        .update({ content: newContent })
        .eq("id", messageId)
        .select("*");

      if (error) throw error;
      return data || [];
    },

    async deleteMessage(messageId: string): Promise<boolean> {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return true;
    },

    async updateTokensUsed(messageId: string, tokensUsed: number): Promise<Message[]> {
      const { data, error } = await supabase
        .from("messages")
        .update({ tokens_used: tokensUsed })
        .eq("id", messageId)
        .select("*");

      if (error) throw error;
      return data || [];
    },
  };

  // ===== SUBSCRIPTIONS =====
  const subscriptions = {
    async createSubscription(data: {
      stripe_subscription_id: string;
      status: string;
      current_period_start: string;
      current_period_end: string;
    }, userId?: string): Promise<any> {
      const id = userId || (getUserId ? await getUserId() : undefined);
      if (!id) throw new Error("User ID required");

      const { data: result, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: id,
          ...data,
        })
        .select("*")
        .single();

      if (error) throw new Error(`Failed to create subscription: ${error.message}`);
      return result;
    },

    async getSubscription(userId?: string): Promise<any> {
      let query = supabase.from("subscriptions").select("*");
      
      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw new Error(`Failed to get subscription: ${error.message}`);
      return data;
    },

    async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
      const { data, error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", subscriptionId)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to update subscription: ${error.message}`);
      return data;
    },
  };

  // ===== API USAGE =====
  const apiUsage = {
    async createUsage(data: {
      chat_id?: string;
      endpoint: string;
      model: string;
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }, userId?: string): Promise<any> {
      const id = userId || (getUserId ? await getUserId() : undefined);
      if (!id) throw new Error("User ID required");

      const { data: result, error } = await supabase
        .from("api_usage")
        .insert({
          user_id: id,
          ...data,
        })
        .select("*")
        .single();

      if (error) throw new Error(`Failed to create API usage record: ${error.message}`);
      return result;
    },

    async getUsage(userId?: string): Promise<any[]> {
      let query = supabase
        .from("api_usage")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      
      if (error) throw new Error(`Failed to get API usage: ${error.message}`);
      return data || [];
    },

    async logApiUsage(data: {
      user_id: string;
      chat_id?: string;
      endpoint: string;
      model: string;
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }): Promise<any> {
      const { data: result, error } = await supabase
        .from("api_usage")
        .insert(data)
        .select("*")
        .single();

      if (error) throw new Error(`Failed to log API usage: ${error.message}`);
      return result;
    },
  };

  // ===== SEARCH =====
  const search = {
    async searchMessagesPaginated(query: string, userId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");

      const { data, error } = await supabase.rpc("search_messages", {
          user_id: id,
          search_query: query,
          page_limit: limit,
          page_offset: offset,
        })
        .select("*");

      if (error) throw new Error(`Failed to search messages: ${error.message}`);
      return data
    },

    async searchMessagesCount(query: string, userId?: string): Promise<number> {
      const id = userId || (await getUserId?.());
      if (!id) throw new Error("User ID required");

      const { data, error } = await supabase.rpc("search_messages_count", {
        user_id: id,
        search_query: query,
      });

      if (error) throw new Error(`Failed to search messages count: ${error.message}`);
      return data;
    }
  }

  // Add other utilities (subscriptions, apiUsage) following the same pattern...

  return {
    profiles,
    chats,
    messages,
    subscriptions,
    apiUsage,
    search,
  };
} 