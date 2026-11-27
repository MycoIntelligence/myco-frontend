"use server";

import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { afterWebsiteAuth, getAccountIntent } from "@/lib/account-paths";
import { trialEmailSchema } from "@/lib/schema";
import { allowRequest } from "@/lib/request-security";
import { createSupabaseServerClient, createWebsiteSignupAdmin } from "@/lib/supabase/server";

type AccountActionState = { error?: string };

const signInFields = z.object({
  email: trialEmailSchema,
  password: z.string().min(1, "Enter your password.").max(1024),
});
const signUpFields = signInFields.extend({
  fullName: z.string().trim().min(1, "Enter your full name.").max(100),
  password: z.string().min(8, "Use at least 8 characters for your password.")
    .regex(/[A-Z]/, "Include at least one uppercase letter in your password.")
    .regex(/[\p{P}\p{S}]/u, "Include at least one special character in your password.")
    .refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "Your password is too long. Use fewer characters and try again.",
  ),
});
const unavailable = { error: "Accounts are unavailable right now. Please try again later." };
const signupFailed = { error: "We couldn’t create this account. If you already have one, sign in." };
const websiteAuthDomain = "myco-website.invalid";

function websiteLoginEmail(email: string) {
  const key = process.env.WEBSITE_LOGIN_NAMESPACE_KEY;
  return key ? `${createHmac("sha256", key).update(email).digest("hex")}@${websiteAuthDomain}` : null;
}

export async function submitCredentials(
  mode: "signup" | "login",
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const credentials = { email: formData.get("email"), password: formData.get("password") };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable;

  if (mode === "signup") {
    const fields = signUpFields.safeParse({ ...credentials, fullName: formData.get("fullName") });
    if (!fields.success) return { error: fields.error.issues[0].message };

    const admin = createWebsiteSignupAdmin();
    if (!admin) return unavailable;
    if (!allowRequest("website-signup", 20)) {
      return { error: "Too many signup attempts. Please try again in a minute." };
    }

    const { password, fullName } = fields.data;
    const email = fields.data.email.toLowerCase();
    if (email.endsWith(`@${websiteAuthDomain}`)) return { error: "Enter a valid email address." };
    const loginEmail = websiteLoginEmail(email);
    if (!loginEmail) return unavailable;

    const { data: signupStatus, error: setupError } = await admin.rpc("website_direct_signup_status", {
      contact_email: email,
    });
    if (setupError || !signupStatus) return unavailable;
    if (signupStatus === "exists") return signupFailed;

    const { error } = await admin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      app_metadata: { myco_website_password_account: true },
      user_metadata: { full_name: fullName, myco_contact_email: email },
    });

    if (error) {
      if (error.code === "weak_password") {
        return { error: "Choose a stronger password and try again." };
      }
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        return signupFailed;
      }
      return { error: "We couldn’t create your account. Please try again shortly." };
    }
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (signInError || !session) {
      return { error: "Your account was created. Sign in with your email and password to continue." };
    }
  } else {
    const fields = signInFields.safeParse(credentials);
    if (!fields.success) return { error: fields.error.issues[0].message };

    const email = fields.data.email.toLowerCase();
    const { password } = fields.data;
    if (email.endsWith(`@${websiteAuthDomain}`)) return { error: "Your email or password is incorrect." };
    const loginEmail = websiteLoginEmail(email);
    const websiteLogin = await supabase.auth.signInWithPassword({ email: loginEmail ?? email, password });
    // Accounts created before direct signup still use their original Auth email.
    const { error } = loginEmail && websiteLogin.error?.code === "invalid_credentials"
      ? await supabase.auth.signInWithPassword({ email, password })
      : websiteLogin;
    if (error?.code === "email_not_confirmed") {
      return { error: "Confirm your email with the link we sent, then sign in." };
    }
    if (error?.code === "invalid_credentials") {
      return { error: "Your email or password is incorrect." };
    }
    if (error) return { error: "We couldn’t sign you in. Please try again shortly." };
  }

  redirect(afterWebsiteAuth(getAccountIntent(formData.get("intent"))));
}

export async function confirmEmail(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const token = formData.get("token");
  const code = formData.get("code");
  const validToken = typeof token === "string" && token.length > 0 && token.length <= 512;
  const validCode = typeof code === "string" && code.length > 0 && code.length <= 512;
  if ((!validToken && !validCode) || (validToken && validCode)) {
    return { error: "This confirmation link is invalid." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable;

  const { data, error } = validToken
    ? await supabase.auth.verifyOtp({ token_hash: token, type: "email" })
    : await supabase.auth.exchangeCodeForSession(code as string);
  if (error || !data.session) {
    return { error: "This confirmation link is invalid or has expired. If you already confirmed your email, sign in." };
  }

  redirect(afterWebsiteAuth(getAccountIntent(data.user?.user_metadata.onboarding_intent)));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await Promise.race([
      supabase.auth.signOut({ scope: "local" }).catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 350)),
    ]);
  }
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
  redirect("/");
}
