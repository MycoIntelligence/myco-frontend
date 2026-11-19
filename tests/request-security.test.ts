import { describe, expect, it } from "vitest";
import { allowRequest, readJsonLimited, RequestTooLarge } from "../lib/request-security";

describe("request security", () => {
  it("rejects an oversized streamed body even without Content-Length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":"123456789"}'));
        controller.close();
      },
    });
    const request = new Request("https://example.test", { method: "POST", body, duplex: "half" } as RequestInit);
    await expect(readJsonLimited(request, 8)).rejects.toBeInstanceOf(RequestTooLarge);
  });

  it("parses a small valid request", async () => {
    const request = new Request("https://example.test", { method: "POST", body: '{"question":"hello"}' });
    await expect(readJsonLimited(request, 128)).resolves.toEqual({ question: "hello" });
  });

  it("limits requests without trusting a caller-provided IP", () => {
    expect(allowRequest("test-limit", 1)).toBe(true);
    expect(allowRequest("test-limit", 1)).toBe(false);
  });
});
