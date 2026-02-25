"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusMessage } from "@/components/common";
import { PrimaryButton, TextInput } from "@/components/ui";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { AUTH_COPY } from "@/features/auth/constants";
import { signup } from "@/features/auth/services/auth-service";

export function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>(AUTH_COPY.signupStatusIdle);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setStatus("Creating account...");

    try {
      await signup(email.trim(), password);
      setStatus("Signup successful. Redirecting to login...");
      router.push("/login?registered=1");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      left={(
        <article className="display-card rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">SIGNUP MODEL</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Build your Taskly identity.</h1>
          <p className="mt-4 text-zinc-300">
            Secure signup first, then authenticate from login to enter the task management desk.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-zinc-300">
            Flow: Signup → Login → Task Desk
          </div>
        </article>
      )}
      right={(
        <article className="display-card rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold">Create account</h2>
          <div className="mt-6 space-y-3">
            <TextInput placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextInput
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PrimaryButton className="w-full" onClick={() => void handleSignup()} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create account"}
            </PrimaryButton>
          </div>

          <StatusMessage className="mt-4">{status}</StatusMessage>

          <p className="mt-5 text-sm text-zinc-300">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[var(--btn-accent-alt)] hover:underline">
              Go to login
            </Link>
          </p>
        </article>
      )}
    />
  );
}
