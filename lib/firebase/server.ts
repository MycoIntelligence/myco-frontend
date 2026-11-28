import { createVerify } from "node:crypto";

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string;
  provider: string;
}

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

function base64UrlDecode(segment: string): Buffer {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return Buffer.from(pad ? normalized + "=".repeat(4 - pad) : normalized, "base64");
}

function getExpectedProjectId(): string {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
}

async function getCertificate(kid: string, forceRefresh = false): Promise<string | undefined> {
  const now = Date.now();
  if (!forceRefresh && certsExpiresAt > now && cachedCerts[kid]) {
    return cachedCerts[kid];
  }

  const response = await fetch(GOOGLE_CERTS_URL, { cache: "no-store" });
  if (!response.ok) return cachedCerts[kid];

  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  const certs = (await response.json()) as Record<string, string>;
  if (certs && typeof certs === "object") {
    cachedCerts = certs;
    certsExpiresAt = now + Math.max(60, maxAgeSec) * 1000;
    return cachedCerts[kid];
  }

  return undefined;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ valid: true; user: VerifiedFirebaseUser } | { valid: false; error: string }> {
  const projectId = getExpectedProjectId();
  if (!projectId) {
    return { valid: false, error: "Firebase authentication is not configured." };
  }
  if (!idToken || typeof idToken !== "string") {
    return { valid: false, error: "Firebase ID token is required." };
  }

  const parts = idToken.trim().split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed Firebase ID token." };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    return { valid: false, error: "Invalid Firebase ID token encoding." };
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    return { valid: false, error: "Invalid Firebase ID token header." };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const clockSkewSec = 30;

  if (typeof payload.exp !== "number" || payload.exp <= nowSec - clockSkewSec) {
    return { valid: false, error: "Your sign-in session expired. Please sign in again." };
  }
  if (typeof payload.iat !== "number" || payload.iat > nowSec + clockSkewSec) {
    return { valid: false, error: "Invalid Firebase ID token issue time." };
  }
  if (typeof payload.auth_time === "number" && payload.auth_time > nowSec + clockSkewSec) {
    return { valid: false, error: "Invalid Firebase authentication timestamp." };
  }
  if (payload.aud !== projectId) {
    return { valid: false, error: "Firebase ID token project mismatch." };
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    return { valid: false, error: "Firebase ID token issuer mismatch." };
  }
  if (typeof payload.sub !== "string" || !payload.sub.trim() || payload.sub.length > 128) {
    return { valid: false, error: "Firebase ID token subject is missing." };
  }

  let certPem = await getCertificate(header.kid);
  if (!certPem) {
    certPem = await getCertificate(header.kid, true);
  }
  if (!certPem) {
    return { valid: false, error: "Unable to verify Firebase signing key." };
  }

  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    if (!verifier.verify(certPem, base64UrlDecode(encodedSignature))) {
      return { valid: false, error: "Invalid Firebase ID token signature." };
    }
  } catch {
    return { valid: false, error: "Firebase ID token signature check failed." };
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const fullName = typeof payload.name === "string" ? payload.name.trim().slice(0, 100) : "";
  const avatarUrl = typeof payload.picture === "string" ? payload.picture.trim().slice(0, 500) : "";
  const firebaseMeta = payload.firebase as { sign_in_provider?: string } | undefined;
  const provider =
    typeof firebaseMeta?.sign_in_provider === "string"
      ? firebaseMeta.sign_in_provider
      : "firebase";

  if (!email) {
    return {
      valid: false,
      error: "We could not read an email address from this account. Grant email access or use Google/email sign-in.",
    };
  }

  return {
    valid: true,
    user: {
      uid: payload.sub,
      email,
      emailVerified: Boolean(payload.email_verified),
      fullName: fullName || email.split("@")[0] || "Myco User",
      avatarUrl,
      provider,
    },
  };
}
