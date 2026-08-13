/**
 * @jest-environment node
 *
 * Route tests for POST /api/sign-out.
 *
 * The redirect is unconditional on purpose — the cookie is what `auth()` reads
 * in middleware, so a failed revoke must not trap the user on a broken page.
 * What it must not do is fail silently: a session that wasn't revoked is a
 * security fact, so the failure is reported even though the response is 303.
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn<Promise<{ sessionId: string | null }>, []>();
const mockRevokeSession = jest.fn();
const mockClerkClient = jest.fn();
const mockReportError = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () => mockClerkClient(),
}));

jest.mock("@/lib/observability", () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

import { POST } from "@/app/api/sign-out/route";

function post(): Promise<Response> {
  return POST(
    new NextRequest("https://siftnews.io/api/sign-out", { method: "POST" }),
  );
}

beforeEach(() => {
  mockAuth.mockReset().mockResolvedValue({ sessionId: "sess_1" });
  mockRevokeSession.mockReset().mockResolvedValue(undefined);
  mockClerkClient
    .mockReset()
    .mockResolvedValue({ sessions: { revokeSession: (id: string) => mockRevokeSession(id) } });
  mockReportError.mockReset();
});

describe("POST /api/sign-out", () => {
  it("revokes the current session and redirects home", async () => {
    const res = await post();
    expect(mockRevokeSession).toHaveBeenCalledWith("sess_1");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://siftnews.io/");
  });

  it("still redirects when there is no session to revoke", async () => {
    mockAuth.mockResolvedValue({ sessionId: null });
    const res = await post();
    expect(mockClerkClient).not.toHaveBeenCalled();
    expect(res.status).toBe(303);
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("reports a failed revoke and redirects anyway", async () => {
    mockRevokeSession.mockRejectedValue(new Error("clerk 503"));
    const res = await post();
    expect(res.status).toBe(303);
    expect(mockReportError).toHaveBeenCalledWith(
      "api.signOut.revokeSession",
      expect.any(Error),
    );
  });
});
