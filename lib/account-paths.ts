export type AccountIntent = "trial" | "account";

export function getAccountIntent(value: unknown): AccountIntent {
  return value === "trial" ? "trial" : "account";
}

export function accountPath(path: "/login" | "/signup" | "/account", intent: AccountIntent) {
  return intent === "trial" ? `${path}?intent=trial` : path;
}

export const trialLoginHref = accountPath("/login", "trial");
export const trialResumeHref = "/?trial=open";

export function afterWebsiteAuth(intent: AccountIntent) {
  return intent === "trial" ? trialResumeHref : "/";
}
