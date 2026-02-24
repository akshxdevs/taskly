"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { loginUser, readSession, saveSession } from "@/lib/taskly";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Authenticate to enter Taskly task management.");

  const registered = useMemo(() => params.get("registered") === "1", [params]);

  useEffect(() => {
    const activeSession = readSession();
    if (activeSession?.token) {
      router.replace("/tasks");
    }
  }, [router]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setStatus("Authenticating...");

    try {
      const response = await loginUser(email.trim(), password);
      saveSession({ user: response.user, token: response.token });
      setStatus("Login successful. Entering Task Desk...");
      router.push("/tasks");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grain-bg relative min-h-screen overflow-hidden text-foreground">
      <span className="ambient-orb ambient-orb-a" />
      <span className="ambient-orb ambient-orb-b" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10 md:px-8">
        <section className="grid w-full gap-6 md:grid-cols-2">
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

          <article className="display-card rounded-3xl p-8 md:p-10">
            <h2 className="text-2xl font-semibold">Log in</h2>
            <div className="mt-6 space-y-3">
              <input
                className="w-full rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleLogin();
                }}
              />
              <button
                className="w-full rounded-full bg-[var(--btn-accent-alt)] px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                onClick={() => void handleLogin()}
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </div>

            <p className="mt-4 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-300">
              {status}
            </p>

            <p className="mt-5 text-sm text-zinc-300">
              Need an account?{" "}
              <Link href="/signup" className="font-semibold text-[var(--btn-accent)] hover:underline">
                Create one
              </Link>
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
