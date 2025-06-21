import { ChatInput } from "@/components/chat-input";
import { createClient } from "@/lib/supabase/server";

import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
import * as db  from "@/lib/db/index";
import { Message } from "@/types/db";
import ChatClient from "@/components/chat-client";

export default async function NewChatPage() {



	return (
		<ChatClient chatId={null} initialMessages={[]} />
	);
}