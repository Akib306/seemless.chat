import { createClient } from "../supabase/server";

export async function getUser(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("users").select("*").eq("id", id);
    return data;
}

export async function createUser(userid: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("users").insert({ id: userid });
    return data;
}







