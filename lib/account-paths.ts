export type AccountIntent = "trial" | "account";

export function getAccountIntent(value: unknown): AccountIntent {
  return value === "trial" ? "trial" : "account";
}

export function accountPath(path: "/login" | "/signup" | "/account", intent: AccountIntent) {
  return intent === "trial" ? `${path}?intent=trial` : path;
}

export const mycoDashboardUrl = (
  process.env.NEXT_PUBLIC_MYCO_DASHBOARD_URL || "https://myco-deploy.onrender.com"
).replace(/\/+$/, "");

export const dashboardOnboardingUrl = `${mycoDashboardUrl}/#/onboarding`;

export const trialLoginHref = accountPath("/login", "trial");
export const trialResumeHref = "/api/dashboard-handoff";

export function afterWebsiteAuth(intent: AccountIntent) {
  return intent === "trial" ? trialResumeHref : "/";
}
