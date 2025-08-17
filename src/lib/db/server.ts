import { createClient } from "../supabase/server";
import { createDbUtils } from "./core";

// Factory function for server-side utilities
export async function createServerDb() {
	const supabase = await createClient();
	return createDbUtils(supabase);
}
