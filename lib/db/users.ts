import supabase from "../supabase/client";

export async function getUser(id: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id);
    return data;
}

export async function createUser(userid: string) {
    const { data, error } = await supabase.from("users").insert({ id: userid });
    return data;
}







