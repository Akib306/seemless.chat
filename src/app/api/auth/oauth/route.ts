import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";
import { warmUserCacheIfNeeded } from "@/lib/cache/warm";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	// if "next" is in param, use it as the redirect URL
	const next = searchParams.get("next") ?? "/chat";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			const { data } = await supabase.auth.getUser();
			if (data.user) {
				try {
					await supabase
						.from("profiles")
						.upsert(
							{ id: data.user.id },
							{ onConflict: "id", ignoreDuplicates: true },
						);
				} catch {
					// Profile creation should not block a valid OAuth login.
				}
				// Warm caches for recent chats immediately after login to avoid cold starts
				try {
					await warmUserCacheIfNeeded(data.user.id);
				} catch {}
			}

			const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
			const forwardedProto = request.headers.get("x-forwarded-proto");
			const isLocalEnv = process.env.NODE_ENV === "development";
			if (isLocalEnv) {
				// we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
				return NextResponse.redirect(`${origin}${next}`);
			} else if (forwardedHost) {
				// Respect x-forwarded-proto when present; avoid forcing https for localhost
				const protocol =
					forwardedProto ??
					(forwardedHost.includes("localhost") ||
					forwardedHost.startsWith("127.0.0.1")
						? "http"
						: "https");
				return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`);
			} else {
				return NextResponse.redirect(`${origin}${next}`);
			}
		}
	}

	// return the user to an error page with instructions
	return NextResponse.redirect(`${origin}/auth/error`);
}
