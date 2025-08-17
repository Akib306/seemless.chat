"use client";
import { useEffect, useRef, lazy, Suspense } from "react";
import { useChatContext } from "@/contexts/chat-context";
import "katex/dist/katex.min.css";

// Lazy load the heavy markdown component to reduce initial bundle size
const MarkdownMessage = lazy(() => import("@/components/markdown-message").then(mod => ({ default: mod.MarkdownMessage })));

export function MessagesList() {
	const { messages } = useChatContext();
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
			<div className="flex-1 px-4 sm:px-6 md:px-8 py-6 flex justify-center text-foreground">
					<div className="w-full max-w-3xl h-full">
							{messages.length === 0 ? (
									<div className="h-full flex items-center justify-center text-gray-400">
											<p className="text-center">Start a conversation by typing a message below.</p>
									</div>
							) : (
									<div className="space-y-6">
											{messages.map((message, index) => {
													const isUser = message.role === "user";
													return (
															<div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
																	{isUser ? (
																			<div className="max-w-[80%] sm:max-w-[75%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-md">
																					<p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
																			</div>
																	) : (
																			<div className="max-w-none w-full text-[15px] leading-7">
																					<Suspense fallback={<div className="text-zinc-400">Loading message...</div>}>
																						<MarkdownMessage content={message.content} />
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
