import { createClient } from "../supabase/server";

export async function createChat(userid: string, title: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("chats")
		.insert({ user_id: userid, title })
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create chat: ${error.message}`);
	}

	if (!data) {
		throw new Error("Chat creation returned no data");
	}

	return data;
}

export async function getChats(userid: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("chats")
		.select("*")
		.eq("user_id", userid);

	if (error) {
		throw new Error(`Failed to fetch chats: ${error.message}`);
	}

	return data || [];
}

export async function getChat(chatid: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("chats")
		.select("*")
		.eq("id", chatid)
		.single();

	if (error) {
		throw new Error(`Failed to fetch chat: ${error.message}`);
	}

	if (!data) {
		throw new Error(`Chat ${chatid} not found`);
	}

	return data;
}

export async function getChatTitle(chatid: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("chats")
		.select("title")
		.eq("id", chatid)
		.single();
	if (error) {
		throw new Error(`Failed to fetch chat title: ${error.message}`);
	}
}

export async function updateChatTitle(chatid: string, title: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("chats")
		.update({ title })
		.eq("id", chatid)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update chat title: ${error.message}`);
	}

	return data;
}

export async function deleteChat(chatid: string) {
	const supabase = await createClient();

	const { error } = await supabase.from("chats").delete().eq("id", chatid);

	if (error) {
		throw new Error(`Failed to delete chat: ${error.message}`);
	}

	return true;
}
