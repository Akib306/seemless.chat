import { createClient } from "../supabase/client";
import type { Chat, Message, Profile } from "@/types/db";

const supabase = createClient();

// Helper function to get current user ID
export async function getCurrentUserId(): Promise<string> {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new Error("User not authenticated");
	}

	return user.id;
}

// ===== PROFILES =====
export const profiles = {
	async getProfile(): Promise<Profile> {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.single();

		if (error) throw new Error(`Failed to get profile: ${error.message}`);
		return data;
	},

	async updateProfile(updates: { username?: string }): Promise<Profile> {
		const { data, error } = await supabase
			.from("profiles")
			.update(updates)
			.select("*")
			.single();

		if (error) throw new Error(`Failed to update profile: ${error.message}`);
		return data;
	},
};

// ===== CHATS =====
export const chats = {
	async createChat(title: string): Promise<Chat> {
		const userId = await getCurrentUserId();

		const { data, error } = await supabase
			.from("chats")
			.insert({
				title,
				user_id: userId,
			})
			.select("*")
			.single();

		if (error) throw new Error(`Failed to create chat: ${error.message}`);

		if (!data) {
			throw new Error("Chat creation returned no data");
		}

		return data;
	},

	async getChats(): Promise<Chat[]> {
		const { data, error } = await supabase
			.from("chats")
			.select("*")
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

		if (!data) {
			throw new Error(`Chat ${chatId} not found`);
		}

		return data;
	},

	async getChatsByUserId(userId: string): Promise<Chat[]> {
		const { data, error } = await supabase
			.from("chats")
			.select("*")
			.eq("user_id", userId)
			.order("updated_at", { ascending: false });

		if (error)
			throw new Error(`Failed to get chats by user ID: ${error.message}`);
		return data || [];
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
};

// ===== MESSAGES =====
export const messages = {
	async createMessage(
		chatId: string,
		message: string,
		role: "user" | "assistant",
		modelUsed?: string,
	): Promise<Message> {
		const userId = await getCurrentUserId();

		const { data, error } = await supabase
			.from("messages")
			.insert({
				chat_id: chatId,
				user_id: userId,
				content: message,
				role,
				model_used: modelUsed,
			})
			.select("*")
			.single();

		if (error) throw new Error(`Failed to create message: ${error.message}`);

		if (!data) {
			throw new Error("Message creation returned no data");
		}

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

	async getMessagesByUserId(): Promise<Message[]> {
		const { data, error } = await supabase
			.from("messages")
			.select("*")
			.order("created_at", { ascending: true });

		if (error) throw error;
		return data || [];
	},

	async getMessageById(messageId: string): Promise<Message> {
		const { data, error } = await supabase
			.from("messages")
			.select("*")
			.eq("id", messageId)
			.single();

		if (error) throw error;
		return data;
	},

	async updateMessage(
		messageId: string,
		newContent: string,
	): Promise<Message[]> {
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

	async updateTokensUsed(
		messageId: string,
		tokensUsed: number,
	): Promise<Message[]> {
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
export const subscriptions = {
	async createSubscription(data: {
		stripe_subscription_id: string;
		status: string;
		current_period_start: string;
		current_period_end: string;
	}): Promise<any> {
		const userId = await getCurrentUserId();

		const { data: result, error } = await supabase
			.from("subscriptions")
			.insert({
				user_id: userId,
				...data,
			})
			.select("*")
			.single();

		if (error)
			throw new Error(`Failed to create subscription: ${error.message}`);
		return result;
	},

	async getSubscription(): Promise<any> {
		const { data, error } = await supabase
			.from("subscriptions")
			.select("*")
			.single();

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

		if (error)
			throw new Error(`Failed to update subscription: ${error.message}`);
		return data;
	},
};

// ===== API USAGE =====
export const apiUsage = {
	async createUsage(data: {
		chat_id?: string;
		endpoint: string;
		model: string;
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	}): Promise<any> {
		const userId = await getCurrentUserId();

		const { data: result, error } = await supabase
			.from("api_usage")
			.insert({
				user_id: userId,
				...data,
			})
			.select("*")
			.single();

		if (error)
			throw new Error(`Failed to create API usage record: ${error.message}`);
		return result;
	},

	async getUsage(): Promise<any[]> {
		const { data, error } = await supabase
			.from("api_usage")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw new Error(`Failed to get API usage: ${error.message}`);
		return data || [];
	},
};
