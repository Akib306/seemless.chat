"use client";
import { useRef, useState } from "react";
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
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
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

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() && files.length === 0) return;

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
				} catch (_) {}
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
		}
	};

	return (
		<div className="p-4 sm:p-6 flex justify-center">
			<form onSubmit={onSubmit} className="relative w-full max-w-3xl">
				{/* File previews */}
				{files.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-2">
						{files.map((file, index) => (
							<div
								key={index}
								className="relative p-2 rounded-md flex items-center gap-2"
								style={{ backgroundColor: "#2A2A2A" }}
							>
								<span
									className="text-sm truncate max-w-[150px]"
									style={{ color: "#F5F5F5" }}
								>
									{file.name}
								</span>
								<button
									type="button"
									onClick={() => removeFile(index)}
									className="text-[#CCCCCC] hover:text-[#FF4C4C]"
								>
									<X size={16} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Input area */}
				<div
					className="flex flex-col rounded-2xl p-2 bg-neutral-900/60 backdrop-blur border border-neutral-800 shadow-sm"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					<textarea
						ref={textareaRef}
						value={input}
						onChange={handleTextareaChange}
						placeholder="Type your message..."
						disabled={isLoading}
						className="flex-1 text-[15px] text-neutral-100 bg-transparent border-none resize-none outline-none min-h-[48px] max-h-[200px] px-3 py-2 placeholder:text-neutral-500"
						rows={1}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								onSubmit(e);
							}
						}}
					/>

					<div className="flex items-center gap-2 mt-2">
						<Select value={model} onValueChange={setModel}>
							<SelectTrigger className="w-auto min-w-[150px] h-9 px-3 rounded-md bg-transparent text-neutral-100 hover:bg-neutral-800/70 border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors">
								<SelectValue placeholder="Select a model" />
							</SelectTrigger>
							<SelectContent
								style={{
									backgroundColor: "#1f1f1f",
									color: "#F5F5F5",
									borderColor: "#2d2d2d",
								}}
							>
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
								className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/70 flex items-center justify-center"
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
								disabled={isLoading || (!input.trim() && files.length === 0)}
								className="rounded-full p-2 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
							>
								{isLoading ? (
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5F5F5] border-t-transparent" />
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
