"use client";
import { useRef, useState, useEffect, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip } from "lucide-react";
import { useChatContext } from "@/contexts/chat-context";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import * as db from "@/lib/db/client";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSignedPreUploadUrl, finalizePreUpload } from "@/app/actions/attachment-actions";
import { toast } from "sonner";
import { AttachmentPreviewGrid } from "@/components/attachment-preview-grid";

const MAX_ATTACHMENTS = 10;

type UploadItem = {
	id: string;
	file: File;
	preUploadPath?: string;
	status: "queued" | "uploading" | "uploaded" | "error";
	error?: string;
};

export function ChatInput() {
	const {
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		model,
		setModel,
		chatId,
		setChatId,
	} = useChatContext();

	const [uploads, setUploads] = useState<UploadItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	// Auto-resize textarea as content grows
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		handleInputChange(e);
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	const preUploadFiles = useCallback(async (filesToAdd: File[]) => {
		const remainingSlots = MAX_ATTACHMENTS - uploads.length;
		if (remainingSlots <= 0) {
			toast("Attachment limit reached", {
				description: `You can attach up to ${MAX_ATTACHMENTS} files per message.`,
			});
			return;
		}

		const toUpload = filesToAdd.slice(0, remainingSlots);
		if (filesToAdd.length > remainingSlots) {
			toast("Only some files were added", {
				description: `Only the first ${remainingSlots} file(s) were queued (max ${MAX_ATTACHMENTS}).`,
			});
		}

		const supabase = createSupabaseBrowserClient();
		const entries = toUpload.map((file) => {
			const id = crypto.randomUUID();
			setUploads((prev) => [...prev, { id, file, status: "uploading" }]);
			return { id, file };
		});

		await Promise.allSettled(
			entries.map(async ({ id, file }) => {
				try {
					const signed = await getSignedPreUploadUrl(file.name);
					// @ts-ignore runtime narrowing
					if (signed?.error) {
						setUploads((prev) =>
							prev.map((u) =>
								u.id === id ? { ...u, status: "error", error: String(signed.error) } : u,
							),
						);
						return;
					}
					// @ts-ignore runtime narrowing
					const { token, fullPath } = (signed.success as { token: string; fullPath: string });
					const { error: uploadError } = await supabase.storage
						.from("chat_attachments")
						.uploadToSignedUrl(fullPath, token, file);
					if (uploadError) {
						setUploads((prev) =>
							prev.map((u) =>
								u.id === id ? { ...u, status: "error", error: uploadError.message } : u,
							),
						);
						return;
					}
					setUploads((prev) =>
						prev.map((u) => (u.id === id ? { ...u, status: "uploaded", preUploadPath: fullPath } : u)),
					);
				} catch (err: any) {
					setUploads((prev) =>
						prev.map((u) =>
							u.id === id ? { ...u, status: "error", error: String(err?.message || err) } : u,
						),
					);
				}
			}),
		);
	}, [uploads.length]);

	// Handle file selection: pre-upload immediately
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		await preUploadFiles(Array.from(e.target.files));
		// reset
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// Handle file removal (try to remove temp upload as well)
	const removeFile = async (id: string) => {
		const item = uploads.find((u) => u.id === id);
		if (item?.preUploadPath && item.status === "uploaded") {
			try {
				const supabase = createSupabaseBrowserClient();
				await supabase.storage.from("chat_attachments").remove([item.preUploadPath]);
			} catch (_) {}
		}
		setUploads((prev) => prev.filter((u) => u.id !== id));
	};

	// Listen for page-level drop events and append files here
	const onFilesDrop = useCallback((e: CustomEvent<{ files: File[] }>) => {
		if (!e?.detail?.files?.length) return;
		preUploadFiles(e.detail.files);
	}, [preUploadFiles]);

	useEffect(() => {
		// @ts-ignore CustomEvent typing at window
		const handler = (ev: Event) => onFilesDrop(ev as any);
		window.addEventListener("chat:files-drop", handler as any);
		return () => window.removeEventListener("chat:files-drop", handler as any);
	}, [onFilesDrop]);

	async function generateTitleAsync(chatId: string, message: string) {
		try {
			const response = await fetch("/api/generate-title", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message, chatId }),
			});

			if (!response.ok) {
				console.warn("Title generation failed, keeping default title");
			}
		} catch (error) {
			console.warn("Title generation error:", error);
			// Fail silently, keep "New Chat"
		}
	}

	useEffect(() => {
		if (!isLoading) {
			setIsSubmitting(false);
		}
	}, [isLoading]);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Guard against concurrent submissions and pre-isLoading window
		const hasUploads = uploads.length > 0;
		const isUploadingAny = uploads.some((u) => u.status === "uploading" || u.status === "queued");
		if (isLoading || isSubmitting || isUploadingAny) {
			if (isUploadingAny) {
				toast("Uploading attachments…", { description: "Please wait for uploads to finish." });
			}
			return;
		}
		if (!input.trim() && !hasUploads) return;
		setIsSubmitting(true);

		try {
			if (uploads.length > 0) {
				const fileNames = uploads.map((u) => u.file.name).join(", ");
				console.log("Files to attach:", fileNames);
			}

			// Handle chat creation for new chats
			let currentChatId = chatId;
			if (!currentChatId) {
				const chat = await db.chats.createChat("New Chat");
				currentChatId = chat.id;
				setChatId(chat.id);
			}

			// Persist the user's message so it isn’t lost on refresh
			let createdMessageId: string | null = null;
			if (currentChatId) {
				const created = await db.messages.createMessage(
					currentChatId,
					input.trim(),
					"user",
					model,
				);
				createdMessageId = created.id;

				// Write-through cache: append the user message to cached array
				try {
					const key = `cache:v1:messages:byChat:${currentChatId}`;
					await fetch("/api/cache/write-through", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							key,
							append: [
								{
									id: createdMessageId || Date.now().toString(),
									chat_id: currentChatId,
									content: input.trim(),
									role: "user",
									model_used: model,
									created_at: new Date().toISOString(),
								},
							],
							ex: CACHE_TTL_SECONDS,
						}),
					});
				} catch (_) {}
			}

			// Start streaming immediately
			handleSubmit(e);

			// Finalize attachments in the background
			if (uploads.length > 0 && createdMessageId) {
				const uploadedItems = uploads.filter((u) => u.status === "uploaded" && !!u.preUploadPath);
				Promise.allSettled(
					uploadedItems.map((u) =>
						finalizePreUpload(
							createdMessageId,
							u.preUploadPath as string,
							u.file.name,
							u.file.size,
							u.file.type,
						).then((res) => {
							// @ts-ignore runtime narrowing
							if (res?.error) {
								toast.error("File failed", { description: u.file.name });
							} else {
								toast.success("File attached", { description: u.file.name });
							}
						}),
					),
				);
			}

			// After creating the chat and storing the first message
			if (!chatId && currentChatId) {
				generateTitleAsync(currentChatId, input.trim());
			}

			setUploads([]);
		} catch (error) {
			console.error("Error in chat submission:", error);
			setIsSubmitting(false);
		}

	};

	return (
		<div className="p-4 sm:p-6 flex justify-center">
			<form ref={formRef} onSubmit={onSubmit} className="relative w-full max-w-3xl">
				{/* File previews */}
				{uploads.length > 0 && (
					<AttachmentPreviewGrid uploads={uploads} onRemove={removeFile} />
				)}

				{/* Input area */}
				<div
					className="flex flex-col rounded-2xl p-2 bg-accent/60 backdrop-blur border border-border shadow-sm"
				>
					<textarea
						ref={textareaRef}
						value={input}
						onChange={handleTextareaChange}
						placeholder="Type your message..."
						disabled={isLoading || isSubmitting}
						className="flex-1 text-[15px] text-foreground-primary bg-transparent border-none resize-none outline-none min-h-[48px] max-h-[200px] px-3 py-2 placeholder:text-foreground-muted"
						rows={1}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								const isUploadingAny = uploads.some((u) => u.status === "uploading" || u.status === "queued");
								if (!isLoading && !isSubmitting && !isUploadingAny) {
									formRef.current?.requestSubmit();
								}
							}
						}}
					/>

					<div className="flex items-center gap-2 mt-2">
						<Select value={model} onValueChange={setModel}>
							<SelectTrigger className="w-auto min-w-[150px] h-9 px-3 rounded-md bg-transparent text-foreground-primary hover:bg-accent/70 border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors">
								<SelectValue placeholder="Select a model" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="gemini-2.0-flash">
									Gemini 2.0 Flash
								</SelectItem>
								<SelectItem value="gemini-1.5-flash">
									Gemini 1.5 Flash
								</SelectItem>
								<SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
								<SelectItem value="gpt-4.1-nano">GPT 4.1 Nano</SelectItem>
							</SelectContent>
						</Select>

						<div className="flex items-center gap-2 ml-auto">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="p-2 rounded-full text-foreground-muted hover:text-foreground-primary hover:bg-accent/70 flex items-center justify-center"
							>
								<Paperclip size={20} />
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									multiple
									className="hidden"
								/>
							</button>

							<Button
								type="submit"
								disabled={
									isLoading ||
									isSubmitting ||
									uploads.some((u) => u.status === "uploading" || u.status === "queued") ||
									(!input.trim() && uploads.length === 0)
								}
								className="rounded-full p-2 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-foreground-muted"
							>
								{isLoading ? (
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
								) : (
									<Send className="h-5 w-5" />
								)}
							</Button>
						</div>
					</div>
				</div>


			</form>
		</div>
	);
}
