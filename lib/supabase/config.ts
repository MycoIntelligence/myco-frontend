export function getSupabaseConfig() {
  const serverUrl = process.env.SUPABASE_URL;
  const serverKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (serverUrl && serverKey) return { url: serverUrl, key: serverKey };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
