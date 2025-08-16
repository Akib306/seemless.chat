import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";
import { createServerDb } from "@/lib/db/server";
import { warmUserCacheIfNeeded } from "@/lib/cache/warm";

export async function GET(request: Request) {
	const db = await createServerDb();
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	// if "next" is in param, use it as the redirect URL
	const next = searchParams.get("next") ?? "/";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                try {
                    await db.profiles.getProfile(data.user.id);
                } catch (error) {
                    // Profile doesn't exist yet, create it for new OAuth users
                    await db.profiles.createProfile(data.user.id);
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
					(forwardedHost.includes("localhost") || forwardedHost.startsWith("127.0.0.1")
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
