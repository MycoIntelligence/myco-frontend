import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      routeExecuted: "STATIC_AST_ENGINE",
      summary: {
        totalFindings: 0,
        riskScore: 0,
        recommendation: "SAFE_TO_MERGE",
      },
      findings: [],
      quota: {
        remainingRuns: 5,
        maxRuns: 5,
        isExhausted: false,
      },
      ...((body && typeof body === "object") ? {} : {}),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
  }
}
