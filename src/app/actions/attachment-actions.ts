"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

const MAX_ATTACHMENTS = 10;

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
 * Generate a signed upload URL for a pre-selected attachment before a message exists.
 * Files are uploaded under: {userId}/uploads/{uuid}.{ext}
 * Returns a token and path usable with uploadToSignedUrl on the client.
 */
export async function getSignedPreUploadUrl(
	fileName: string,
) {
	const supabase = await createClient();

	const { data: authData, error: authError } = await supabase.auth.getUser();
	if (authError || !authData?.user) {
		return { error: "You must be logged in to upload files." } as const;
	}

	// derive extension safely
	const ext = fileName.includes(".") ? fileName.split(".").pop() ?? "bin" : "bin";
	const uniqueName = `${randomUUID()}.${ext}`;
	const path = `${authData.user.id}/uploads/${uniqueName}`;

	const { data, error } = await supabase.storage
		.from("chat_attachments")
		.createSignedUploadUrl(path, { upsert: false });

	if (error || !data) {
		console.error("createSignedUploadUrl (pre) failed", error);
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

	// Enforce per-message attachment limit
	const { count: existingCount } = await supabase
		.from("attachments")
		.select("id", { count: "exact", head: true })
		.eq("message_id", messageId);
	if ((existingCount ?? 0) >= MAX_ATTACHMENTS) {
		return { error: `You can attach up to ${MAX_ATTACHMENTS} files per message.` } as const;
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

/**
 * Finalize a pre-uploaded file by moving it from the temporary uploads folder
 * to the message-specific folder and recording attachment metadata.
 */
export async function finalizePreUpload(
	messageId: string,
	preUploadPath: string,
	fileName: string,
	fileSize: number,
	mimeType: string,
) {
	const supabase = await createClient();
	const { data: authData, error: authError } = await supabase.auth.getUser();
	if (authError || !authData?.user) {
		return { error: "Authentication failed." } as const;
	}

	const userId = authData.user.id;
	if (!preUploadPath.startsWith(`${userId}/uploads/`)) {
		return { error: "Authorization error: invalid preupload path." } as const;
	}

	// Check current count before moving to avoid orphaning finalized files
	const { count: existingCount } = await supabase
		.from("attachments")
		.select("id", { count: "exact", head: true })
		.eq("message_id", messageId);
	if ((existingCount ?? 0) >= MAX_ATTACHMENTS) {
		try {
			await supabase.storage.from("chat_attachments").remove([preUploadPath]);
		} catch (_) {}
		return { error: `You can attach up to ${MAX_ATTACHMENTS} files per message.` } as const;
	}

	const basename = preUploadPath.split("/").pop() || fileName;
	const finalPath = `${userId}/${messageId}/${basename}`;

	const { error: moveError } = await supabase.storage
		.from("chat_attachments")
		.move(preUploadPath, finalPath);
	if (moveError) {
		console.error("finalizePreUpload: move failed", moveError);
		return { error: "Failed to finalize uploaded file." } as const;
	}

	const { data, error } = await supabase
		.from("attachments")
		.insert({
			message_id: messageId,
			user_id: userId,
			storage_path: finalPath,
			file_name: fileName,
			file_size: fileSize,
			mime_type: mimeType,
		})
		.select()
		.single();

	if (error) {
		try {
			await supabase.storage.from("chat_attachments").remove([finalPath]);
		} catch (_) {}
		console.error("finalizePreUpload: insert failed", error);
		return { error: "Failed to save attachment details." } as const;
	}

	return { success: data } as const;
}


