"use client";
import { ChatInput } from "@/components/chat-input";
import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
import { Message } from "@/types/db";
import { useRef, useEffect, type DragEvent } from "react";

/**
 * Interactive chat client with full functionality.
 * This is now dynamically imported to reduce initial bundle size.
 */
export default function ChatClientInteractive({
	chatId,
	initialMessages,
}: {
	chatId: string | null;
	initialMessages: Message[];
}) {
	const overlayRef = useRef<HTMLDivElement | null>(null);
	const dragDepthRef = useRef(0);

	const isFileDrag = (e: DragEvent) => {
		const types = Array.from(e.dataTransfer?.types ?? []);
		return types.includes("Files");
	};

	const showOverlay = () => {
		if (!overlayRef.current) return;
		overlayRef.current.classList.remove("opacity-0");
		overlayRef.current.classList.add("opacity-100");
	};

	const hideOverlay = () => {
		if (!overlayRef.current) return;
		overlayRef.current.classList.remove("opacity-100");
		overlayRef.current.classList.add("opacity-0");
	};

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		showOverlay();
		dragDepthRef.current += 1;
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		showOverlay();
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
		if (dragDepthRef.current === 0) {
			hideOverlay();
		}
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		if (!isFileDrag(e)) return;
		e.preventDefault();
		dragDepthRef.current = 0;
		hideOverlay();
		const dropped = Array.from(e.dataTransfer.files ?? []);
		if (dropped.length > 0) {
			window.dispatchEvent(
				new CustomEvent("chat:files-drop", { detail: { files: dropped } }),
			);
		}
	};

	// Prevent the browser from navigating when dropping files outside the chat area (e.g., sidebar)
	useEffect(() => {
		const preventDefaultForFiles = (e: any) => {
			const types = Array.from(e?.dataTransfer?.types ?? []);
			if (types.includes("Files")) {
				e.preventDefault();
			}
		};
		window.addEventListener("dragover", preventDefaultForFiles);
		window.addEventListener("drop", preventDefaultForFiles);
		return () => {
			window.removeEventListener("dragover", preventDefaultForFiles);
			window.removeEventListener("drop", preventDefaultForFiles);
		};
	}, []);

	return (
		<ChatProvider initialMessages={initialMessages} chatId={chatId}>
			<div
				className="h-screen w-full flex flex-col overflow-hidden bg-background relative"
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<div className="flex-1 min-h-0 overflow-auto flex justify-center">
					<MessagesList />
				</div>

				{/* 
                    This div is styled to always stay glued to the bottom of the viewport (visible area).
                    We use position: sticky and bottom: 0 so it remains visible at the bottom as you scroll.
                    The background ensures it doesn't overlap with content behind, and zIndex keeps it above other elements.
                */}
				<div className="flex-shrink-0 sticky bottom-0 left-0 w-full bg-background z-10">
					<ChatInput />
				</div>

				<div
					ref={overlayRef}
					className="absolute inset-0 z-20 pointer-events-none bg-background/40 backdrop-blur-md opacity-0 transition-opacity"
				>
					<div className="flex h-full w-full items-center justify-center">
						<div className="pointer-events-none mx-4 sm:mx-6 md:mx-8 w-full max-w-3xl rounded-2xl border-2 border-dashed border-primary/60 bg-primary/5 px-6 py-8 text-center text-foreground-primary">
							<div className="text-base text-foreground-primary">Drop files to attach (max 10)</div>
							<div className="mt-1 text-xs text-foreground-secondary">Files will be added to your next message</div>
						</div>
					</div>
				</div>
			</div>
		</ChatProvider>
	);
}
