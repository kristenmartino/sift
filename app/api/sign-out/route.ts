import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { reportError } from "@/lib/observability";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await auth();
    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    }
  } catch (err) {
    // If Clerk is misconfigured or session revoke fails, still redirect home —
    // the cookie-based session is the source of truth for auth() in middleware.
    // Reported because a session that wasn't actually revoked is a security
    // fact, not a cosmetic one.
    reportError("api.signOut.revokeSession", err);
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
