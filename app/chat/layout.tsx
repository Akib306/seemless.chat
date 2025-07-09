
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/chat-sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          {children}
        </main>
      </SidebarProvider>

    </div>
  )
} 