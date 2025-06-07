export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    id: string;
}

export interface ApiUsage {
    id?: string;                    
    user_id: string;               
    chat_id?: string | null;       
    endpoint: string;             
    model: string;                
    prompt_tokens: number;        
    completion_tokens: number;     
    total_tokens: number;          
    created_at?: string;           
}

export type ChatMessages = ChatMessage[]; 