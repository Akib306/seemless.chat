import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

const metadata = {
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
			<body>

				{/* Azure Depths */}
				<div
					className="absolute inset-0 -z-10"
					style={{
						background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
					}}
				/>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					disableTransitionOnChange
				>
					<main className="min-h-screen flex flex-col">
						<Navbar />
						<div className="flex-1 flex flex-col">{children}</div>
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
