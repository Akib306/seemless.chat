"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUser, LogOut } from "lucide-react";

type ChatSidebarFooterProps = {
	displayName: string;
	userEmail: string | null;
	onLogout: () => void | Promise<void>;
};

export function ChatSidebarFooter({
	displayName,
	userEmail,
	onLogout,
}: ChatSidebarFooterProps) {
	return (
		<>
			<div className="group-data-[collapsible=icon]:hidden border-t">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-transparent border border-transparent transition-colors hover:bg-sidebar-accent/40">
							<span className="flex items-center gap-3">
								<Avatar>
									<AvatarImage src={undefined} alt={displayName} />
									<AvatarFallback>
										{displayName.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="flex flex-col items-start">
									<span className="text-sm font-medium leading-5">
										{displayName}
									</span>
									<span className="text-xs text-muted-foreground leading-4">
										Signed in
									</span>
								</span>
							</span>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						side="top"
						sideOffset={8}
						className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60"
					>
						<DropdownMenuLabel className="font-normal">
							<div className="flex items-center gap-2 text-muted-foreground">
								<CircleUser className="h-4 w-4" />
								<p className="text-sm leading-none">
									{userEmail ?? displayName}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={onLogout}
							className="rounded-xl px-3 py-2 text-base text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" /> Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Collapsed footer avatar only, also acts as menu trigger */}
			<div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button aria-label="Open user menu" className="rounded-full">
							<Avatar>
								<AvatarImage src={undefined} alt={displayName} />
								<AvatarFallback>
									{displayName.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						side="right"
						sideOffset={8}
						className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60"
					>
						<DropdownMenuLabel className="font-normal">
							<div className="flex items-center gap-2 text-muted-foreground">
								<CircleUser className="h-4 w-4" />
								<p className="text-sm leading-none">
									{userEmail ?? displayName}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={onLogout}
							className="rounded-xl px-3 py-2 text-base text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" /> Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</>
	);
}


