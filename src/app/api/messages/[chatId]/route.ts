import { createClient } from "@/lib/supabase/server";
import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import {
	estimateBytes,
	heartbeat,
	ensureUnderQuota,
	recordChatSize,
} from "@/lib/cache/quota";
import { convertToUIMessage } from "@/lib/utils/message-mapper";
import type { Message } from "@/types/db";

/**
 * GET /api/messages/[chatId]
 * 
 * Fetches messages for a chat with Redis caching.
 * Returns UI-formatted messages for client-side rendering.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ chatId: string }> }
) {
	try {
		const { chatId } = await params;
		if (!chatId) {
			return Response.json({ error: "chatId is required" }, { status: 400 });
		}

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return Response.json({ error: "unauthorized" }, { status: 401 });
		}

		const db = await createServerDb();

		// Verify the user has access to this chat
		try {
			await db.chats.getChat(chatId);
		} catch {
			return Response.json({ error: "chat not found" }, { status: 404 });
		}

		const cacheKey = `cache:v1:messages:byChat:${chatId}`;
		const cached = await redis.get<any[]>(cacheKey);

		let messages = cached as any[] | null;

		if (!messages) {
			messages = await db.messages.getMessagesByChatId(chatId);
		}

		// Convert to UI messages with parts
		const uiMessages = await Promise.all(
			messages.map(async (msg: Message) => {
				const parts = await db.messageParts.getPartsByMessageId(msg.id);
				return convertToUIMessage(msg, parts);
			})
		);

		// Cache the messages if they weren't cached
		if (!cached) {
			try {
				const approxBytes = estimateBytes(messages);
				await Promise.all([
					redis.set(cacheKey, messages, { ex: CACHE_TTL_SECONDS }),
					recordChatSize(user.id, chatId, approxBytes),
					(async () => {
						const { perUserBudgetBytes } = await heartbeat(user.id);
						await ensureUnderQuota(user.id, perUserBudgetBytes);
					})(),
				]);
			} catch {
				// Non-critical caching errors
			}
		}

		return Response.json({ messages: uiMessages });
	} catch (error) {
		console.error("[api/messages] Error fetching messages:", error);
		return Response.json({ error: "internal error" }, { status: 500 });
	}
}
