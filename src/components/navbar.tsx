"use client";

import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
	const pathname = usePathname();
	const isChatPage = pathname?.startsWith("/chat");
	const isLandingPage = pathname === "/";

	if (isChatPage) {
		return null;
	}

	return (
		<nav className="fixed top-0 z-50 w-full flex justify-center border-b border-white/10 h-16 bg-black/20 backdrop-blur-md">
			<div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
				<div className="flex gap-5 items-center font-semibold">
					<Link href={"/"} className="text-white hover:text-white/80 transition-colors">
						Seamless Chat
					</Link>
				</div>
				<div className="flex items-center gap-4">
					{/* <LogoutButton /> */}
					{isLandingPage && (
						<Button asChild size="sm" variant="ghost">
							<Link href="/auth/login">Log In</Link>
						</Button>
					)}
					<ThemeSwitcher />
				</div>
			</div>
		</nav>
	);
}
