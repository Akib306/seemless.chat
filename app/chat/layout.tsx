
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/chat-sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarProvider>

    </div>
  )
} 