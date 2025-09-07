import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Ensure this route tree is always evaluated on the server and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth guard for all /chat routes
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }
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
