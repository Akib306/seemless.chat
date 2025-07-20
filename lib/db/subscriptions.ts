import { createClient } from "../supabase/server";

export async function createSubscription(
	userid: string,
	subscriptionid: string,
) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("subscriptions")
		.insert({ userid, subscriptionid });
	return data;
}

export async function getSubscription(userid: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("subscriptions")
		.select("*")
		.eq("userid", userid);
	return data;
}

export async function getSubscriptionBySubscriptionId(subscriptionid: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("subscriptions")
		.select("*")
		.eq("subscriptionid", subscriptionid);
	return data;
}

export async function cancelSubscription(userid: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("subscriptions")
		.update({ status: "cancelled" })
		.eq("userid", userid);
	return data;
}

export async function getSubscriptionStatus(userid: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("subscriptions")
		.select("status")
		.eq("userid", userid);
	return data;
}
