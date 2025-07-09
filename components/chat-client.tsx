import { ChatInput } from "@/components/chat-input";

import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
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
            <div
                className="h-full w-full grid"
                style={{
                    backgroundColor: "#1A1A1A",
                    gridTemplateRows: "1fr auto",
                    minHeight: "0", // for proper scroll
                }}
            >
                <div className="overflow-auto max-h-0 flex justify-center">
                    <MessagesList />
                </div>

                {/* 
                    This div is styled to always stay glued to the bottom of the viewport (visible area).
                    We use position: sticky and bottom: 0 so it remains visible at the bottom as you scroll.
                    The background ensures it doesn't overlap with content behind, and zIndex keeps it above other elements.
                */}
                <div
                    className="flex-shrink-0"
                    style={{
                        position: "sticky", // Keeps the input bar stuck to the bottom of its container
                        bottom: 0,           // Stick to the bottom edge
                        left: 0,
                        width: "100%",
                        background: "#1A1A1A", // Match chat background
                        zIndex: 10,           // Ensure it's above other content
                    }}
                >
                    <ChatInput />
                </div>
            </div>
        </ChatProvider>
    )
}