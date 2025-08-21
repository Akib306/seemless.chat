"use client";

import { SidebarHeader, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Image from "next/image";
import { LogoMark } from "@/components/ui/logo";
import { useRouter } from "next/navigation";
import { Edit, Search, BookMarked, Play, Grid3X3 } from "lucide-react";
import { SearchModal } from "./search-modal";

export function ChatSidebarHeader() {
	const router = useRouter();
	const { state } = useSidebar();

	return (
		<SidebarHeader>
			<div className="px-0">
				{/* Top bar: logo + collapse trigger */}
				<div
					className={`flex items-center ${state === "expanded" ? "justify-between" : "justify-center"} px-2 ${state === "expanded" ? "py-1" : "py-2"}`}
				>
					<LogoMark className="h-5 w-5 text-foreground-primary" />
					{state === "expanded" && <SidebarTrigger />}
				</div>

				{state === "expanded" ? (
					<div className="pb-1 text-foreground-secondary">
						<Button
							variant="ghost"
							className="w-full justify-start gap-2 py-2 px-2 h-10 rounded-lg text-base"
							onClick={() => router.push("/chat")}
						>
							<Edit className="h-4 w-4" />
							New chat
						</Button>

						{/* Search row uses modal */}
						<SearchModal collapsed={false} />
						<span className="tracking-wide text-sm text-foreground-muted pl-2">
							CHATS
						</span>
					</div>

				) : (
					<div className="flex flex-col items-center gap-3 py-2">
						{/* Toggle placed in the same grid as the other icon buttons for consistent sizing */}
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10 text-foreground-primary"
							asChild
						>
							<span>
								<SidebarTrigger />
							</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10 text-foreground-primary"
							onClick={() => router.push("/chat")}
						>
							<Edit className="h-5 w-5 text-foreground-primary" />
						</Button>
						<SearchModal collapsed={true} />
					</div>
				)}
			</div>
		</SidebarHeader>
	);
}
