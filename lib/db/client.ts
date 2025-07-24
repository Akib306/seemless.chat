import { createClient } from "../supabase/client";
import { createDbUtils } from "./core";

const supabase = createClient();

// Helper function to get current user ID
export async function getCurrentUserId(): Promise<string> {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new Error("User not authenticated");
	}

	return user.id;
}

// Create client-side database utilities
export const { profiles, chats, messages } = createDbUtils(supabase, getCurrentUserId);
