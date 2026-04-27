import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await auth();
    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    }
  } catch {
    // If Clerk is misconfigured or session revoke fails, still redirect home —
    // the cookie-based session is the source of truth for auth() in middleware.
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
