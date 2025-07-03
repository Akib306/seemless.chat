"use client"
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "@/components/markdown-components";
import { useEffect, useRef } from "react";
import { useChatContext } from "@/contexts/chat-context";
import "katex/dist/katex.min.css";

export function MessagesList() {
	const { messages } = useChatContext();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		};
	
		// Auto-scroll whenever messages are updated
		useEffect(() => {
			scrollToBottom();
		}, [messages]);
    
	return (
		<div className="flex-1 overflow-y-auto p-4 mb-4 flex justify-center" style={{ color: "#F5F5F5" }}>
			<div className="w-full max-w-3xl">
				{messages.length === 0 ? (
					<div className="text-center h-full flex items-center justify-center" style={{ color: "#CCCCCC" }}>
						<p>Start a conversation by typing a message below.</p>
					</div>
				) : (
						messages.map((message, index) => (
							<div
								key={index}
								className={`mb-6 ${message.role === "user" ? "text-right" : "text-left"
								}`}
							>
								<div
									className={`${message.role === "user"
										? "inline-block p-4 rounded-2xl max-w-[80%] bg-[#6A8DAD] text-[#F5F5F5] text-lg text-left"
										: "text-left w-full text-lg py-2"
										}`}
									style={{
										boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
										animation: "fadeIn 0.3s ease-in-out"
									}}
								>
									{message.role === "user" ? (
										<p className="whitespace-pre-wrap">{message.content}</p>
									) : (
										<ReactMarkdown
											remarkPlugins={[remarkGfm, remarkMath]}
											rehypePlugins={[rehypeKatex]}
											components={markdownComponents}
										>
											{message.content}
										</ReactMarkdown>
									)}
								</div>
							</div>
						))
				)}
				<div ref={messagesEndRef} />
			</div>
		</div>
	)
}