// Limits are deliberately shared across visitors when no trusted client identity
// is available. Forwarded headers are not an authenticated identity.
const buckets = new Map<string, { count: number; expires: number }>();

export function allowRequest(bucket: string, limit: number): boolean {
  const now = Date.now();
  const current = buckets.get(bucket);
  if (!current || current.expires <= now) {
    buckets.set(bucket, { count: 1, expires: now + 60_000 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count++;
  return true;
}

export class RequestTooLarge extends Error {}

export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new RequestTooLarge();
  }
  if (!request.body) throw new SyntaxError("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
