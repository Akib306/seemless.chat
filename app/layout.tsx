import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Seamless Chat",
  description: "Your multi-AI chat platform for seamless conversations",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <nav className="fixed top-0 z-50 w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background">

              <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Link href={"/"}>Seamless Chat</Link>
                </div>
                <div className="flex items-center gap-4">
                  <HeaderAuth />
                  <ThemeSwitcher />
                </div>
              </div>
            </nav>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
