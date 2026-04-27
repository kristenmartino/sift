import { ClerkProvider } from "@clerk/nextjs";
import { notFound } from "next/navigation";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = !!clerkPk && clerkPk.startsWith("pk_");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!clerkEnabled) notFound();
  return <ClerkProvider>{children}</ClerkProvider>;
}
