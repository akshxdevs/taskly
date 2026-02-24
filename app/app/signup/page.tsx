"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signupUser } from "@/lib/taskly";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Create your account to unlock Taskly.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password.trim()) {
      setStatus("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setStatus("Creating account...");

    try {
      await signupUser(email.trim(), password);
      setStatus("Signup successful. Redirecting to login...");
      router.push("/login?registered=1");
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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">SIGNUP MODEL</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Build your Taskly identity.</h1>
            <p className="mt-4 text-zinc-300">
              Secure signup first, then authenticate from login to enter the task management desk.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-zinc-300">
              Flow: Signup → Login → Task Desk
            </div>
          </article>

          <article className="display-card rounded-3xl p-8 md:p-10">
            <h2 className="text-2xl font-semibold">Create account</h2>
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
              />
              <button
                className="w-full rounded-full bg-[var(--btn-accent)] px-4 py-3 font-semibold text-black transition hover:bg-[#98ffc3] disabled:opacity-60"
                onClick={() => void handleSignup()}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create account"}
              </button>
            </div>

            <p className="mt-4 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-300">
              {status}
            </p>

            <p className="mt-5 text-sm text-zinc-300">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-[var(--btn-accent-alt)] hover:underline">
                Go to login
              </Link>
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
