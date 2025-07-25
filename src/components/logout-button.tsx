"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/app/components/ui/button";

export function LogoutButton() {
	const router = useRouter();

	const logout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	return <Button onClick={logout}>Logout</Button>;
}
