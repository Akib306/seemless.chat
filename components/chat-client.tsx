import { ChatInput } from "@/components/chat-input";
import { createClient } from "@/lib/supabase/server";

import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
import * as db  from "@/lib/db/index";
import { Message } from "@/types/db";

export default function ChatClient({
    chatId,
    initialMessages,
}: {
    chatId: string | null;
    initialMessages: Message[];
}) {
    return (
        <ChatProvider initialMessages={initialMessages} chatId={chatId}>
            <div className="flex flex-col h-full" style={{ backgroundColor: "#1A1A1A" }}>
                <MessagesList />
                <ChatInput />
            </div>
        </ChatProvider>
    )
}