import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-full w-full">
			<SidebarProvider>
				<ChatSidebar />
				<main className="flex-1">{children}</main>
			</SidebarProvider>
		</div>
	);
}
