'use client'

import { createContext, useContext, useState } from "react";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import { Message } from "@/types/db";
import { Message as MessageType } from "@ai-sdk/react";

type ChatContextType = UseChatHelpers & {
    model: string,
    setModel: React.Dispatch<React.SetStateAction<string>>
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children, initialMessages }: { children: React.ReactNode, initialMessages: Message[] }) => {

    const [model, setModel] = useState('gemini-2.0-flash');
    const chat = useChat({
        api: "/api/chat",
        body: {
            model
        },
        initialMessages: initialMessages.map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
        })),
    })
    return <ChatContext.Provider value={{ ...chat, model, setModel }}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === null) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};