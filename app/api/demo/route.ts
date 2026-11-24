import { NextRequest, NextResponse } from "next/server";
import { demoFormSchema, trialRequestSchema } from "@/lib/schema";
import { deliverLead } from "@/lib/leads";
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

    const isTrial = body && typeof body === "object" && "kind" in body && body.kind === "trial";
    const result = (isTrial ? trialRequestSchema : demoFormSchema).safeParse(body);
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

