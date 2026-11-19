import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    quota: {
      remainingRuns: 5,
      maxRuns: 5,
      isExhausted: false,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}
