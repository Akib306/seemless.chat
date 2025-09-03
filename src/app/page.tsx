import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GlowEffectButton } from "@/components/glow-effect-button";

export default function Home() {
	return (
		<div className="min-h-screen w-full relative">
			{/* Your Content/Components */}
			<main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16 min-h-screen">
				<h1 className="text-4xl font-bold text-center text-white">Seamless Chat</h1>
				<p className="text-xl text-center max-w-2xl text-gray-200">
					Your multi-AI chat platform for seamless conversations
				</p>
				<GlowEffectButton href="/auth/sign-up" showArrow={false}>
					Sign Up
				</GlowEffectButton>
				
			</main>
		</div>
	);
}
