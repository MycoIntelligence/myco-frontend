import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { afterWebsiteAuth, getAccountIntent } from "@/lib/account-paths";
import { verifyFirebaseIdToken } from "@/lib/firebase/server";
import { allowRequest, readJsonLimited, RequestTooLarge } from "@/lib/request-security";
import { createSupabaseServerClient, createWebsiteSignupAdmin } from "@/lib/supabase/server";

const WEBSITE_AUTH_DOMAIN = "myco-website.invalid";

const requestSchema = z.object({
  idToken: z.string().trim().min(20).max(8192),
  intent: z.unknown().optional(),
});

function buildWebsiteAuthEmail(contactEmail: string): string | null {
  const key = process.env.WEBSITE_LOGIN_NAMESPACE_KEY;
  return key ? `${createHmac("sha256", key).update(contactEmail).digest("hex")}@${WEBSITE_AUTH_DOMAIN}` : null;
}

export async function POST(request: Request) {
  if (!allowRequest("website-firebase-auth", 30)) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-in attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await readJsonLimited(request, 16 * 1024);
  } catch (error) {
    if (error instanceof RequestTooLarge) {
      return NextResponse.json({ ok: false, error: "Request payload too large." }, { status: 413 });
    }
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Firebase ID token is required." }, { status: 400 });
  }

  const verified = await verifyFirebaseIdToken(parsed.data.idToken);
  if (!verified.valid) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 401 });
  }

  const admin = createWebsiteSignupAdmin();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) {
    return NextResponse.json(
      { ok: false, error: "Website authentication service is unavailable right now." },
      { status: 503 }
    );
  }

  const fbUser = verified.user;
  const contactEmail = fbUser.email.toLowerCase();
  if (contactEmail.endsWith(`@${WEBSITE_AUTH_DOMAIN}`)) {
    return NextResponse.json({ ok: false, error: "Enter a valid work email address." }, { status: 400 });
  }

  try {
    // Store in the existing public.website_customer_data table via Supabase Auth triggers
    const { data: existingProfile, error: profileLookupError } = await admin
      .from("website_customer_data")
      .select("user_id, full_name, email")
      .ilike("email", contactEmail)
      .maybeSingle();

    if (profileLookupError) {
      return NextResponse.json(
        { ok: false, error: "Unable to verify existing customer record." },
        { status: 500 }
      );
    }

    let authEmailForSession: string | null = null;
    let resolvedName = fbUser.fullName;

    if (existingProfile?.user_id) {
      const { data: existingAuthUser, error: userFetchError } = await admin.auth.admin.getUserById(
        existingProfile.user_id
      );
      if (userFetchError || !existingAuthUser?.user?.email) {
        return NextResponse.json(
          { ok: false, error: "Unable to restore existing website account." },
          { status: 500 }
        );
      }

      authEmailForSession = existingAuthUser.user.email;
      const existingMeta = (existingAuthUser.user.user_metadata || {}) as Record<string, unknown>;
      const existingName =
        typeof existingProfile.full_name === "string" && existingProfile.full_name.trim()
          ? existingProfile.full_name.trim()
          : typeof existingMeta.full_name === "string"
          ? existingMeta.full_name.trim()
          : "";
      resolvedName = existingName || fbUser.fullName;

      await admin.auth.admin.updateUserById(existingProfile.user_id, {
        user_metadata: {
          ...existingMeta,
          full_name: resolvedName,
          myco_contact_email: contactEmail,
          ...(fbUser.avatarUrl ? { avatar_url: fbUser.avatarUrl } : {}),
          firebase_uid: fbUser.uid,
          firebase_provider: fbUser.provider,
        },
      });
    } else {
      const loginEmail = buildWebsiteAuthEmail(contactEmail);
      if (!loginEmail) {
        return NextResponse.json(
          { ok: false, error: "Website login namespace key is not configured." },
          { status: 503 }
        );
      }

      const generatedPassword = `${randomBytes(24).toString("base64url")}Aa1!`;
      const { error: createError } = await admin.auth.admin.createUser({
        email: loginEmail,
        password: generatedPassword,
        email_confirm: true,
        app_metadata: { myco_website_password_account: true },
        user_metadata: {
          full_name: fbUser.fullName,
          myco_contact_email: contactEmail,
          ...(fbUser.avatarUrl ? { avatar_url: fbUser.avatarUrl } : {}),
          firebase_uid: fbUser.uid,
          firebase_provider: fbUser.provider,
        },
      });

      if (createError) {
        if (createError.code === "user_already_exists" || createError.code === "email_exists") {
          authEmailForSession = loginEmail;
        } else {
          return NextResponse.json(
            { ok: false, error: "We couldn't create your website account. Please try again." },
            { status: 500 }
          );
        }
      } else {
        authEmailForSession = loginEmail;
      }
    }

    if (!authEmailForSession) {
      return NextResponse.json(
        { ok: false, error: "Unable to initialize website session." },
        { status: 500 }
      );
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authEmailForSession,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return NextResponse.json(
        { ok: false, error: "Could not issue website login session. Please try again." },
        { status: 500 }
      );
    }

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (otpError || !otpData?.session) {
      return NextResponse.json(
        { ok: false, error: "Failed to establish authenticated website session." },
        { status: 500 }
      );
    }

    const intent = getAccountIntent(parsed.data.intent);
    return NextResponse.json({
      ok: true,
      redirectTo: afterWebsiteAuth(intent),
      profile: {
        name: resolvedName,
        email: contactEmail,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unexpected error during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
