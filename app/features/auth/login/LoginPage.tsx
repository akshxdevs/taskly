"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { StatusMessage } from "@/components/common";
import { PrimaryButton, TextInput } from "@/components/ui";
import { saveSession, setRuntimeAuthToken } from "@/lib/auth";
import { AUTH_COPY } from "@/features/auth/constants";
import { useSessionRedirect } from "@/features/auth/hooks/useSessionRedirect";
import { login } from "@/features/auth/services/auth-service";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>(AUTH_COPY.loginStatusIdle);

  const registered = useMemo(() => params.get("registered") === "1", [params]);

  useSessionRedirect(
    useCallback(() => {
      router.replace("/tasks");
    }, [router]),
  );

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setStatus("Authenticating...");

    try {
      const response = await login(email.trim(), password);
      saveSession({ user: response.user });
      setRuntimeAuthToken(response.token);
      setStatus("Login successful. Entering Task Desk...");
      router.replace("/tasks");
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">LOGIN MODEL</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Secure access. Instant control.</h1>
          <p className="mt-4 text-zinc-300">
            Once login succeeds, Taskly routes you directly into the protected task management desk.
          </p>
          {registered ? (
            <p className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Signup complete. Please log in to continue.
            </p>
          ) : null}
        </article>
      )}
      right={(
        <article className="display-card rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold">Log in</h2>
          <div className="mt-6 space-y-3">
            <TextInput placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextInput
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleLogin();
              }}
            />
            <PrimaryButton className="w-full bg-[var(--btn-accent-alt)] hover:bg-cyan-300" onClick={() => void handleLogin()} disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </PrimaryButton>
          </div>

          <StatusMessage className="mt-4">{status}</StatusMessage>

          <p className="mt-5 text-sm text-zinc-300">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-[var(--btn-accent)] hover:underline">
              Create one
            </Link>
          </p>
        </article>
      )}
    />
  );
}
