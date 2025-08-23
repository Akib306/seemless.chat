"use client";
import { useRef, useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, X } from "lucide-react";
import { useChatContext } from "@/contexts/chat-context";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import * as db from "@/lib/db/client";
import { useRouter } from "next/navigation";

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

	const router = useRouter();
	const [files, setFiles] = useState<File[]>([]);
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

	// Handle file selection
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			setFiles((prev) => [...prev, ...newFiles]);
		}
	};

	// Handle file removal
	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	// Handle file drop
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer.files) {
			const newFiles = Array.from(e.dataTransfer.files);
			setFiles((prev) => [...prev, ...newFiles]);
		}
	};

	// Prevent default behavior for drag events
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

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
		if (isLoading || isSubmitting) return;
		if (!input.trim() && files.length === 0) return;
		setIsSubmitting(true);

		try {
			if (files.length > 0) {
				const fileNames = files.map((f) => f.name).join(", ");
				console.log("Files to upload:", fileNames);
			}

			// Handle chat creation for new chats
			let currentChatId = chatId;
			if (!currentChatId) {
				const chat = await db.chats.createChat("New Chat");
				currentChatId = chat.id;
				setChatId(chat.id);
			}

			// Persist the user's message so it isn’t lost on refresh
			if (currentChatId) {
				await db.messages.createMessage(
					currentChatId,
					input.trim(),
					"user",
					model,
				);

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
									id: Date.now().toString(),
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
				} catch (_) { }
			}

			// After creating the chat and storing the first message
			if (!chatId && currentChatId) {
				// This is the first message in a new chat
				generateTitleAsync(currentChatId, input.trim());
			}

			// Let useChat handle the submission
			handleSubmit(e);

			setFiles([]);
		} catch (error) {
			console.error("Error in chat submission:", error);
			setIsSubmitting(false);
		}

	};

	return (
		<div className="p-4 sm:p-6 flex justify-center">
			<form ref={formRef} onSubmit={onSubmit} className="relative w-full max-w-3xl">
				{/* File previews */}
				{files.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-2">
						{files.map((file, index) => (
							<div
								key={index}
								className="relative p-2 rounded-md flex items-center gap-2 bg-muted"
							>
								<span
									className="text-sm truncate max-w-[150px] text-foreground-primary"
								>
									{file.name}
								</span>
								<button
									type="button"
									onClick={() => removeFile(index)}
									className="text-foreground-muted hover:text-destructive"
								>
									<X size={16} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Input area */}
				<div
					className="flex flex-col rounded-2xl p-2 bg-accent/60 backdrop-blur border border-border shadow-sm"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
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
								if (!isLoading && !isSubmitting) {
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
								disabled={isLoading || isSubmitting || (!input.trim() && files.length === 0)}
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
