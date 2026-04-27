import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import SignOutForm from "./SignOutForm";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = !!clerkPk && clerkPk.startsWith("pk_");

export default async function AuthButtons() {
  if (!clerkEnabled) return null;

  const { userId } = await auth();

  if (userId) {
    return <SignOutForm />;
  }

  return (
    <Link
      href="/sign-in"
      className="px-3.5 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 font-body inline-flex items-center"
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      }}
      title="Sign in to sync bookmarks and custom topics across devices"
    >
      Sign in
    </Link>
  );
}
