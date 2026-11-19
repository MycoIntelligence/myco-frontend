import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/src/lib/assistant-retrieval";
import { allowRequest, readJsonLimited, RequestTooLarge } from "@/lib/request-security";

export const runtime = "nodejs";
const schema = z.object({ question: z.string().trim().min(2).max(1000) });

export async function POST(request: NextRequest) {
  if (!allowRequest("assistant", 120)) return NextResponse.json({ error: "Please wait before asking another question." }, { status: 429 });
  try {
    const data = schema.safeParse(await readJsonLimited(request, 8192));
    if (!data.success) return NextResponse.json({ error: "Enter a question between 2 and 1,000 characters." }, { status: 400 });
    return NextResponse.json({ success: true, ...answerQuestion(data.data.question) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestTooLarge) return NextResponse.json({ error: "Question is too long." }, { status: 413 });
    return NextResponse.json({ error: "Unable to process this question." }, { status: 400 });
  }
}
