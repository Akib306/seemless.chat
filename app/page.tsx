import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
	return (
		<main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16">
			<h1 className="text-4xl font-bold text-center">Seamless Chat</h1>
			<p className="text-xl text-center max-w-2xl">
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
	);
}
