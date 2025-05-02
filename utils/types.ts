export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    id: string;
}

export type ChatMessages = ChatMessage[]; 