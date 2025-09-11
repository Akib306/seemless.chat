"use client";
import { useEffect, useRef, lazy, Suspense } from "react";
import { useChatContext } from "@/contexts/chat-context";
import "katex/dist/katex.min.css";
import MessageAttachments from "@/components/message-attachments";

// Lazy load the heavy markdown component to reduce initial bundle size
const MarkdownMessage = lazy(() =>
	import("@/components/markdown-message").then((mod) => ({
		default: mod.MarkdownMessage,
	})),
);

export function MessagesList() {
	const { messages, chatId } = useChatContext();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({
				behavior: "smooth",
				block: "end",
			});
		}
	};

	// scroll every time any message changes (safe & simple)
	useEffect(() => {
		if (messages.length) {
			scrollToBottom();
		}
	}, [messages]);

	return (
		<div className="flex-1 px-4 sm:px-6 md:px-8 py-6 flex justify-center text-foreground-primary">
			<div className="w-full max-w-3xl h-full">
				{messages.length === 0 ? (
					<div className="h-full flex items-center justify-center text-foreground-muted">
						<p className="text-center">
							Start a conversation by typing a message below.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{messages.map((message, index) => {
							const isUser = message.role === "user";
							return (
								<div
									key={index}
									className={`flex ${isUser ? "justify-end" : "justify-start"}`}
								>
									{isUser ? (
										<div className="max-w-[80%] sm:max-w-[75%]">
											{/* Persisted attachments for this message */}
											{/* We don't have chat_id on UI message type; resolve via context later if needed */}
											<MessageAttachments messageId={message.id} chatId={chatId ?? ""} content={Array.isArray((message as any).parts)
												? ((message as any).parts as any[])
													.filter((p: any) => p?.type === "text")
													.map((p: any) => p.text)
													.join("")
												: ""} isUser={isUser} />
											<div className="rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-md">
												<p className="whitespace-pre-wrap leading-relaxed text-[15px]">
													{Array.isArray((message as any).parts)
														? ((message as any).parts as any[]).map((part: any, i: number) =>
															part?.type === "text" ? <span key={i}>{part.text}</span> : null,
														)
														: null}
												</p>
											</div>
										</div>
									) : (
										<div className="max-w-none w-full text-[15px] leading-7">
											<Suspense
												fallback={
													<div className="text-foreground-muted">
														Loading message...
													</div>
												}
											>
												<MarkdownMessage content={Array.isArray((message as any).parts)
													? ((message as any).parts as any[])
														.filter((p: any) => p?.type === "text")
														.map((p: any) => p.text)
														.join("")
													: ""} />
											</Suspense>
										</div>
									)}
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>
		</div>
	);
}
