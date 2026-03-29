"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

const clerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

function ClerkAuthButtons() {
  const { user } = useUser();

  if (user) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <SignInButton mode="modal">
      <button
        className="px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 font-body"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        Sign in
      </button>
    </SignInButton>
  );
}

export default function AuthButtons() {
  if (!clerkEnabled) return null;
  return <ClerkAuthButtons />;
}
