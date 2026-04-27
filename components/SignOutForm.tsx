"use client";

export default function SignOutForm() {
  return (
    <form action="/api/sign-out" method="POST">
      <button
        type="submit"
        className="px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 font-body"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
        title="Sign out"
      >
        Sign out
      </button>
    </form>
  );
}
