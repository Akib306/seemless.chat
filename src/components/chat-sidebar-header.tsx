"use client";

import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit, Search, PanelLeft } from "lucide-react";
import { SearchForm } from "./search-form";
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
							className="relative w-10 h-10 flex items-center justify-center cursor-pointer group/logo"
								onClick={toggleSidebar}
							>
								<Image
									src="/logo.svg"
									alt="Seemless Chat Logo"
									width={40}
									height={40}
								className="object-contain transition-opacity duration-200 group-hover/logo:opacity-0"
									style={{
										filter:
											"invert(45%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(90%) contrast(90%)",
									}}
								/>
							<PanelLeft 
								className="absolute inset-0 m-auto w-10 h-10 p-2 opacity-0 transition-opacity duration-200 group-hover/logo:opacity-100 pointer-events-none" 
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
					<SearchForm placeholder="Search chat history..." />
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
						
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10"
							onClick={() => {
								// You can add search functionality here
								console.log("Search clicked");
							}}
						>
							<Search className="h-5 w-5" />
						</Button>
					</div>
				</>
			)}
    </>
  );
}