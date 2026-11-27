import { NextResponse } from "next/server";
import { getMycoDashboardUrl, trialLoginHref } from "@/lib/account-paths";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const sessionResult = await getWebsiteCustomerSession({ readOnly: true });
  if (!sessionResult) {
    return NextResponse.redirect(new URL(trialLoginHref, request.url));
  }

  const dashboardUrl = getMycoDashboardUrl();
  if (!dashboardUrl) {
    return NextResponse.json(
      { error: "MYCO_DASHBOARD_URL is not configured." },
      { status: 500 }
    );
  }

  const { data: { session } } = await sessionResult.supabase.auth.getSession();
  const baseTarget = `${dashboardUrl}/?source=website`;
  const targetUrl = session?.access_token
    ? `${baseTarget}#sso_token=${encodeURIComponent(session.access_token)}`
    : `${baseTarget}#/onboarding`;

  return NextResponse.redirect(targetUrl);
}
