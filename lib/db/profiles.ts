import { createClient } from "../supabase/server";

export async function getProfile(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id);
    return data;
}

export async function createProfile(userid: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").insert({ id: userid });
    return data;
}







