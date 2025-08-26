"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

/**
 * Generate a signed upload URL for a user's attachment under:
 *   {userId}/{messageId}/{uuid}.{ext}
 * Returns a token and path usable with uploadToSignedUrl on the client.
 */
export async function getSignedUploadUrl(
	fileName: string,
	messageId: string,
) {
	const supabase = await createClient();

	const { data: authData, error: authError } = await supabase.auth.getUser();
	if (authError || !authData?.user) {
		return { error: "You must be logged in to upload files." } as const;
	}

	// derive extension safely
	const ext = fileName.includes(".") ? fileName.split(".").pop() ?? "bin" : "bin";
	const uniqueName = `${randomUUID()}.${ext}`;
	const path = `${authData.user.id}/${messageId}/${uniqueName}`;

	const { data, error } = await supabase.storage
		.from("chat_attachments")
		.createSignedUploadUrl(path, { upsert: false });

	if (error || !data) {
		console.error("createSignedUploadUrl failed", error);
		return { error: "Could not create upload URL. Please try again." } as const;
	}

	return { success: { ...data, fullPath: data.path } } as const;
}

/**
 * Persist attachment metadata after a successful upload to storage.
 */
export async function recordAttachment(
	messageId: string,
	storagePath: string,
	fileName: string,
	fileSize: number,
	mimeType: string,
) {
	const supabase = await createClient();
	const { data: authData, error: authError } = await supabase.auth.getUser();
	if (authError || !authData?.user) {
		return { error: "Authentication failed." } as const;
	}

	// Validate path belongs to the user (defense-in-depth beyond RLS checks)
	if (!storagePath.startsWith(authData.user.id)) {
		return { error: "Authorization error: invalid storage path." } as const;
	}

	const { data, error } = await supabase
		.from("attachments")
		.insert({
			message_id: messageId,
			user_id: authData.user.id,
			storage_path: storagePath,
			file_name: fileName,
			file_size: fileSize,
			mime_type: mimeType,
		})
		.select()
		.single();

	if (error) {
		console.error("recordAttachment insert failed", error);
		return { error: "Failed to save attachment details." } as const;
	}

	return { success: data } as const;
}


