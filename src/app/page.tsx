import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen w-full relative">
			{/* Azure Depths */}
			<div
				className="absolute inset-0 z-0"
				style={{
					background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
				}}
			/>
			{/* Your Content/Components */}
			<main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16 min-h-screen">
				<h1 className="text-4xl font-bold text-center text-white">Seamless Chat</h1>
				<p className="text-xl text-center max-w-2xl text-gray-200">
					Your multi-AI chat platform for seamless conversations
				</p>
				<div className="flex gap-4">
					<Button asChild>
						<Link href="/auth/login">Log In</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/auth/sign-up">Sign Up</Link>
					</Button>
				</div>
			</main>
		</div>
	);
}
