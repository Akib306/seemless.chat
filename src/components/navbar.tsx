"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // optional helper; replace with your own if needed

// const navLinks = [
//   { href: "/features", label: "Features" },
//   { href: "/pricing", label: "Pricing" },
//   { href: "/changelog", label: "Changelog" },
// ];

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-2 text-sm transition-colors",
        active
          ? "text-white"
          : "text-white/70 hover:text-white"
      )}
    >
      <span className="relative">
        {label}
        {active && (
          <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-white/80" />
        )}
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/chat");

  if (isChatPage) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-3">
      <nav
        className="
          w-full max-w-6xl
          h-14
          rounded-2xl
					border
          flex items-center justify-between
          px-4 md:px-6
        "
        role="navigation"
        aria-label="Primary"
      >
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold text-white hover:text-white/80 transition-colors"
          >
            {/* Small logo dot */}
            <span className="h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_12px_2px_rgba(255,255,255,0.45)]" />
            <span>Seamless Chat</span>
          </Link>
        </div>

        {/* Center: Nav items (hide on mobile for cleanliness) */}
        {/* <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <NavItem key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
        </div> */}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
					<Button asChild size="sm" variant="secondary" className="text-white/80 hover:text-white">
						<Link href="/auth/login">Login</Link>
					</Button>
          {/* <ThemeSwitcher /> */}
        </div>
      </nav>
    </div>
  );
}
