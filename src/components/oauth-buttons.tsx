"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GoogleLogo, GitHubLogo } from "@/components/ui/icons";

export function OAuthButtons({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const redirectedTo: string = "/chat";
	const [isLoading, setIsLoading] = useState<{
		github: boolean;
		google: boolean;
	}>({
		github: false,
		google: false,
	});
	const [error, setError] = useState<string | null>(null);

	const handleOAuthLogin = async (provider: "github" | "google") => {
		setIsLoading((prev) => ({ ...prev, [provider]: true }));
		setError(null);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/api/auth/oauth?next=${redirectedTo}`,
				},
			});

			if (error) throw error;
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "An error occurred");
			setIsLoading({
				github: false,
				google: false,
			});
		}
	};

	return (
		<div className={cn(className)} {...props}>
			{error && <p className="text-sm text-red-500">{error}</p>}

			<Button
				className="mb-4 flex items-center justify-center"
				variant="outline"
				onClick={() => handleOAuthLogin("google")}
				disabled={isLoading.google}
			>
				{!isLoading.google && <GoogleLogo />}
				{isLoading.google ? "Waiting on Google..." : "Continue with Google"}
			</Button>

			<Button
				className="mb-4 flex items-center justify-center"
				variant="outline"
				onClick={() => handleOAuthLogin("github")}
				disabled={isLoading.github}
			>
				{!isLoading.github && <GitHubLogo />}
				{isLoading.github ? "Waiting on GitHub..." : "Continue with GitHub"}
			</Button>
		</div>
	);
}
