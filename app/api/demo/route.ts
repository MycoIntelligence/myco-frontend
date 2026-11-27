import { NextRequest, NextResponse } from "next/server";
import { betaRequestSchema, demoFormSchema, trialGitHubUsernameError, trialRequestSchema } from "@/lib/schema";
import { deliverLead } from "@/lib/leads";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";
import { allowRequest, readJsonLimited, RequestTooLarge } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  try {
    if (!allowRequest("demo", 20)) return NextResponse.json({ ok: false, message: "Too many requests. Please wait." }, { status: 429, headers: { "Retry-After": "60" } });
    let body: unknown;
    try {
      body = await readJsonLimited(req, 8192);
    } catch (error) {
      if (error instanceof RequestTooLarge) return NextResponse.json({ ok: false, message: "Request is too large." }, { status: 413 });
      if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
      throw error;
    }

    // Check honeypot
    if (body && typeof body === "object" && "website" in body && body.website && String(body.website).trim().length > 0) {
      // Silently accept but drop
      return NextResponse.json({ ok: true });
    }

    const requestKind = body && typeof body === "object" && "kind" in body ? body.kind : undefined;
    if (requestKind === "trial" && !(await getWebsiteCustomerSession())) {
      return NextResponse.json({
        ok: false,
        message: "Sign in to request a free trial.",
      }, { status: 401 });
    }

    const isTrial = requestKind === "trial" || requestKind === "upgrade";
    const result = (requestKind === "beta" ? betaRequestSchema : isTrial ? trialRequestSchema : demoFormSchema).safeParse(body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = String(issue.path[0]);
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if ("githubUsername" in result.data) {
      try {
        const username = result.data.githubUsername;
        const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        });
        if (response.status !== 404 && !response.ok) throw new Error("GitHub lookup failed");
        const account = response.ok ? await response.json() : null;

        if (account?.type !== "User" || account.login?.toLowerCase() !== username.toLowerCase()) {
          return NextResponse.json({
            ok: false,
            errors: { githubUsername: trialGitHubUsernameError },
          }, { status: 400 });
        }
      } catch {
        return NextResponse.json({
          ok: false,
          message: "We couldn’t verify your GitHub username right now. Please try again.",
        }, { status: 503 });
      }
    }

    const leadId = `lead_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    await deliverLead({
      ...result.data,
      id: leadId,
      timestamp,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Avoid logging submitted details or webhook credentials.
    console.error("Lead request could not be delivered.");
    return NextResponse.json(
      { ok: false, message: "We could not send your request. Please try again later." },
      { status: 503 }
    );
  }
}

