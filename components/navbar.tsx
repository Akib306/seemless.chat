"use client";

import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');

  if (isChatPage) {
    return null;
  }

  return (
    <nav className="fixed top-0 z-50 w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"}>Seamless Chat</Link>
        </div>
        <div className="flex items-center gap-4">
          {/* <LogoutButton /> */}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
} 