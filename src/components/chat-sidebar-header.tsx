"use client";

import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit, Search, PanelLeft } from "lucide-react";
import { SearchModal } from "./search-modal";
import { useSidebar } from "@/components/ui/sidebar";

export function ChatSidebarHeader() {
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  
	return (
    <>
      {/* Fixed header that's always visible */}
			<div className={`fixed top-4 left-4 z-50 flex items-center ${state === "expanded" ? "w-64" : "gap-2"}`}>
				{state === "expanded" ? (
					<div className="flex justify-between items-center w-full">
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
						<SidebarTrigger className="h-10 w-10" />
					</div>
				) : (
					<>
						{/* Logo that becomes toggle on hover */}
						<div className="flex justify-center w-full">
							<div 
								className="relative w-10 h-10 flex items-center justify-center"
							>
								<Image
									src="/logo.svg"
									alt="Seemless Chat Logo"
									width={40}
									height={40}
									className="object-contain hover:opacity-0 transition-opacity duration-200 cursor-pointer peer"
									style={{
										filter:
											"invert(45%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(90%) contrast(90%)",
									}}
									onClick={toggleSidebar}
								/>
								<PanelLeft 
									className="absolute w-10 h-10 p-2 opacity-0 peer-hover:opacity-100 transition-opacity duration-200 cursor-pointer" 
									onClick={toggleSidebar}
								/>
							</div>
						</div>
					</>
				)}
			</div>

      {/* Content based on state */}
			{state === "expanded" ? (
				<>
					{/* New Chat Button */}
					<div className="px-2 py-2">
						<Button
							variant="default"
							className="w-full flex items-center justify-center gap-2"
							onClick={() => {
								router.push("/chat");
							}}
						>
							<Edit className="h-5 w-5" />
							New Chat
						</Button>
					</div>

					{/* Search Form */}
					<SearchModal collapsed={false} />
				</>
			) : (
				<>
					{/* Collapsed mode icons */}
					<div className="flex flex-col items-center gap-4 px-2 py-2 w-full">
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10"
							onClick={() => {
								router.push("/chat");
							}}
						>
							<Edit className="h-5 w-5" />
						</Button>
						
						<SearchModal collapsed={true} />
					</div>
				</>
			)}
    </>
  );
}