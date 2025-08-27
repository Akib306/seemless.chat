import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-full w-full">
			<SidebarProvider>
				<ChatSidebar />
				<main className="flex-1 chat-theme">
					{children}
					<Toaster position="top-center" richColors />
				</main>
			</SidebarProvider>
		</div>
	);
}
