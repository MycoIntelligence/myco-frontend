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

  let accessToken: string | undefined = sessionResult.accessToken;
  if (!accessToken && sessionResult.supabase?.auth?.getSession) {
    const { data: { session } } = await sessionResult.supabase.auth.getSession();
    accessToken = session?.access_token;
  }

  const baseTarget = `${dashboardUrl}/?source=website`;
  const targetUrl = accessToken
    ? `${baseTarget}#sso_token=${encodeURIComponent(accessToken)}`
    : `${baseTarget}#/onboarding`;

  return NextResponse.redirect(targetUrl);
}
