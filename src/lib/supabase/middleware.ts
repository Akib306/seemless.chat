import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	// Handle provider landing on the Site URL with ?code=... as early as possible,
	// before any Supabase client work. This avoids edge/env issues preventing the
	// exchange from happening.
	const earlyPath = request.nextUrl.pathname;
	const earlyIsApi = earlyPath.startsWith("/api");
	if (!earlyIsApi) {
		const earlyCode = request.nextUrl.searchParams.get("code");
		if (earlyCode) {
			const nextParam = request.nextUrl.searchParams.get("next") ?? "/chat";
			const url = request.nextUrl.clone();
			url.pathname = "/api/auth/oauth";
			url.search = `?code=${encodeURIComponent(earlyCode)}&next=${encodeURIComponent(nextParam)}`;
			return NextResponse.redirect(url);
		}
	}

	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Do not run code between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: DO NOT REMOVE auth.getUser()

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Allow API routes (including OAuth callback under `/api/auth/*`) to pass through
	// without redirect guards so that auth code exchanges can complete successfully
	const path = request.nextUrl.pathname;
	const isApiRoute = path.startsWith("/api");

	// If a provider redirected back to the Site URL with ?code=..., immediately
	// forward to our OAuth handler so the session can be established. This covers
	// cases where the provider/Supabase falls back to the Site URL instead of our
	// provided redirectTo, which would otherwise strand the user on the homepage.
	if (!isApiRoute) {
		const code = request.nextUrl.searchParams.get("code");
		if (code) {
			const nextParam = request.nextUrl.searchParams.get("next") ?? "/chat";
			const url = request.nextUrl.clone();
			url.pathname = "/api/auth/oauth";
			url.search = `?code=${encodeURIComponent(code)}&next=${encodeURIComponent(nextParam)}`;
			return NextResponse.redirect(url);
		}
	}

	if (
		!user &&
		!isApiRoute &&
		!path.startsWith("/login") &&
		!path.startsWith("/auth") &&
		path !== "/"
	) {
		// This check protects all routes that aren't explicitly excluded.
		// Protected routes include: /chat, /protected, etc.
		// Any route that isn't the homepage ('/'), doesn't start with '/login',
		// and doesn't start with '/auth' will redirect unauthenticated users to login.
		const url = request.nextUrl.clone();
		url.pathname = "/auth/login";
		return NextResponse.redirect(url);
	}

	// IMPORTANT: You *must* return the supabaseResponse object as it is.
	// If you're creating a new response object with NextResponse.next() make sure to:
	// 1. Pass the request in it, like so:
	//    const myNewResponse = NextResponse.next({ request })
	// 2. Copy over the cookies, like so:
	//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
	// 3. Change the myNewResponse object to fit your needs, but avoid changing
	//    the cookies!
	// 4. Finally:
	//    return myNewResponse
	// If this is not done, you may be causing the browser and server to go out
	// of sync and terminate the user's session prematurely!

	return supabaseResponse;
}
