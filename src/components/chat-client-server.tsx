import { Message } from "@/types/db";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the heavy client components to reduce initial bundle size
const ChatClientInteractive = dynamic(
	() => import("@/components/chat-client-interactive"),
	{
		loading: () => (
			<div
				className="h-screen w-full flex flex-col overflow-hidden bg-background"
			>
				<div className="flex-1 min-h-0 overflow-auto flex justify-center">
					<div className="w-full max-w-3xl px-4 py-6 space-y-4">
						{/* Simulated message bubbles */}
						<div className="flex gap-3 justify-end">
							<div className="flex-1 space-y-2 max-w-xl">
								<div className="h-4 w-full bg-muted rounded animate-pulse" />
								<div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
							</div>
							<div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
						</div>
						<div className="flex gap-3">
							<div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
								<div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
							</div>
						</div>
					</div>
				</div>
				{/* Loading input area */}
				<div className="flex-shrink-0 px-4 pb-6">
					<div className="h-14 w-full bg-muted rounded animate-pulse" />
				</div>
			</div>
		),
	},
);

interface ChatClientServerProps {
	chatId: string | null;
	initialMessages: Message[];
}

/**
 * Server-rendered chat client that lazy loads interactive components.
 * This reduces the initial compilation time by deferring heavy client components.
 */
export default function ChatClientServer({
	chatId,
	initialMessages,
}: ChatClientServerProps) {
	return (
		<Suspense
			fallback={
				<div
					className="h-screen w-full flex flex-col overflow-hidden bg-background"
				>
					<div className="flex-1 min-h-0 overflow-auto flex justify-center">
						<div className="w-full max-w-3xl flex items-center justify-center">
							<div className="text-foreground-muted">Loading chat...</div>
						</div>
					</div>
				</div>
			}
		>
			<ChatClientInteractive
				chatId={chatId}
				initialMessages={initialMessages}
			/>
		</Suspense>
	);
}
