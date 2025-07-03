'use client'
import { createContext, useContext, useRef, useState } from "react";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import { Message } from "@/types/db";
import * as db from "@/lib/db/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ChatContextType = UseChatHelpers & {
    model: string,
    setModel: React.Dispatch<React.SetStateAction<string>>
    chatId: string | null,
    setChatId: React.Dispatch<React.SetStateAction<string | null>>
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children, initialMessages, chatId }: { children: React.ReactNode, initialMessages: Message[], chatId: string | null }) => {
    const [model, setModel] = useState('gemini-2.0-flash');
    const [chatIdState, setChatId] = useState(chatId);
    const router = useRouter();

    const latestChatId = useRef(chatIdState);
    const isNewChat = useRef(chatId === null); 
    
    useEffect(() => {
        
        latestChatId.current = chatIdState;
        // If chatId changes from null to something, it's no longer a new chat
        
    }, [chatIdState]);

    const chat = useChat({
        api: "/api/chat",
        body: {
            model,
            chatId: latestChatId.current
        },
        initialMessages: initialMessages.map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant" | "system" | "data",
            content: message.content,
        })),
        onFinish: async (message, options) => {
            if (latestChatId.current) {
                await db.messages.createMessage(latestChatId.current, message.content, message.role as "user" | "assistant", model)
                router.push(`/chat/${latestChatId.current}`)
            }
        }
    });

    return <ChatContext.Provider value={{ ...chat, model, setModel, chatId: chatIdState, setChatId }}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === null) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};