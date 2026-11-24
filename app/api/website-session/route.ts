import { getWebsiteCustomerSession } from "@/lib/supabase/server";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  const session = await getWebsiteCustomerSession();
  if (!session) return Response.json({ profile: null }, { headers });

  const { user, supabase } = session;
  const { data } = await supabase.from("website_customer_data")
    .select("full_name").eq("user_id", user.id).maybeSingle();
  const fullName = data?.full_name ?? user.user_metadata.full_name;
  return Response.json({
    profile: {
      name: typeof fullName === "string" ? fullName.trim().slice(0, 100) : "",
    },
  }, { headers });
}
