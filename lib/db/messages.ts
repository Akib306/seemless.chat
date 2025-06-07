import { createClient } from "../supabase/server";

// Create a new message
export async function createMessage(chatid: string, message: string, userId: string, role: 'user' | 'ai', modelUsed?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("messages").insert({ 
        chat_id: chatid, 
        content: message,
        user_id: userId,
        role,
        model_used: modelUsed
    });
    
    if (error) throw error;
    return data;
}

// Get all messages for a specific chat
export async function getMessagesByChatId(chatId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data;
}

// Get a specific message by ID
export async function getMessageById(messageId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();
    
    if (error) throw error;
    return data;
}

// Update a message (only users can update their own messages)
export async function updateMessage(messageId: string, newContent: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("messages")
        .update({ content: newContent })
        .eq("id", messageId)
        .select();
    
    if (error) throw error;
    return data;
}

// Delete a message
export async function deleteMessage(messageId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);
    
    if (error) throw error;
    return true;
}

// Update tokens used for a message
export async function updateTokensUsed(messageId: string, tokensUsed: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("messages")
        .update({ tokens_used: tokensUsed })
        .eq("id", messageId)
        .select();
    
    if (error) throw error;
    return data;
}
