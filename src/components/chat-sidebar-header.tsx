"use client";

import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SearchForm } from "./search-form";

export function ChatSidebarHeader() {
  const router = useRouter();
  
	return (
    <>
      {/* Fixed header that's always visible */}
			<div className="fixed top-4 left-4 z-50 flex items-center gap-2">
				<div className="relative w-10 h-10">
					<Image
						src="/logo.svg"
						alt="Seemless Chat Logo"
						fill
						className="object-contain"
						style={{
							filter:
								"invert(45%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(90%) contrast(90%)",
						}}
					/>
				</div>
				<span className="font-semibold text-base">Seemless Chat</span>
				<SidebarTrigger className="h-10 w-10" />
			</div>

      {/* New Chat Button */}
			<div className="px-2 py-2">
				<Button
					variant="default"
					className="w-full flex items-center justify-center gap-2"
					onClick={() => {
						router.push("/chat");
					}}
				>
					<Plus className="h-4 w-4" />
					New Chat
				</Button>
			</div>

			{/* Search Form */}
			<SearchForm placeholder="Search chat history..." />
    </>
  );
}