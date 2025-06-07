import supabase from "../supabase/client";

export async function createChat(userid: string, title: string) {
    const { data, error } = await supabase.from("chats").insert({ userid });
    return data;
}

export async function getChats(userid: string) {
    const { data, error } = await supabase.from("chats").select("*").eq("userid", userid);
    return data;
}

export async function getChat(chatid: string) {
    const { data, error } = await supabase.from("chats").select("*").eq("id", chatid);
    return data;
}

export async function updateChatTitle(chatid: string, title: string) {
    const { data, error } = await supabase.from("chats").update({ title }).eq("id", chatid);
    return data;
}

export async function deleteChat(chatid: string) {
    const { data, error } = await supabase.from("chats").delete().eq("id", chatid);
    return data;
}














