"use client";

import Link from "next/link";
import { useState } from "react";
import { AppBackground } from "@/components/layout";
import { readSession } from "@/lib/auth";

const boardCards = [
  {
    title: "Focused Task Desk",
    subtitle: "Fast create, status changes, and delete actions with sharp keyboard-first flow.",
    badge: "SPEED",
  },
  {
    title: "Protected Access",
    subtitle: "Task management unlocks only after successful login for a clean auth boundary.",
    badge: "SECURE",
  },
  {
    title: "Production API Wiring",
    subtitle: "Routes align directly with your Go endpoints for user and task operations.",
    badge: "READY",
  },
];

const productModels = [
  {
    title: "Auth Separation Architecture",
    detail:
      "Dedicated signup and login routes keep user onboarding clear while protecting task operations behind validated sessions.",
    tag: "MODEL-01",
  },
  {
    title: "Session Guard Runtime",
    detail:
      "Local session state routes authenticated users directly to task desk and safely redirects guests back to login.",
    tag: "MODEL-02",
  },
  {
    title: "Live Task Pipeline",
    detail:
      "Create, update status, filter, search, and delete tasks in one streamlined command surface for focused execution.",
    tag: "MODEL-03",
  },
  {
    title: "Auth Verification Layer",
    detail:
      "Inline verification checks expose authentication status without interrupting active task management flow.",
    tag: "MODEL-04",
  },
  {
    title: "Go API Surface Mapping",
    detail:
      "Frontend modules map directly to user and task endpoints to reduce integration friction and debugging overhead.",
    tag: "MODEL-05",
  },
  {
    title: "Operator-Centric UX",
    detail:
      "Minimal friction layouts, quick actions, and status visibility are tuned for high-frequency task operations.",
    tag: "MODEL-06",
  },
];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.41-4.04-1.41-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.09-.72.09-.72 1.2.08 1.84 1.22 1.84 1.22 1.08 1.83 2.82 1.3 3.5.99.1-.76.42-1.3.76-1.6-2.67-.3-5.47-1.32-5.47-5.9 0-1.3.47-2.37 1.23-3.2-.13-.3-.53-1.5.12-3.13 0 0 1-.32 3.3 1.22a11.7 11.7 0 0 1 6 0c2.3-1.54 3.29-1.22 3.29-1.22.65 1.63.25 2.84.12 3.13.77.83 1.23 1.9 1.23 3.2 0 4.6-2.8 5.59-5.49 5.89.43.37.81 1.1.81 2.23v3.3c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LandingPage() {
  const [isLoggedIn] = useState(() => Boolean(readSession()?.user?.id));

  return (
    <AppBackground>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-zinc-400">GO-TASKLY</p>
            <h1 className="text-xl font-semibold tracking-tight">Taskly</h1>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs tracking-[0.14em] text-zinc-300">
                PRODUCT STORY
              </span>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-medium text-zinc-100 transition hover:border-white/35 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-full bg-[var(--btn-accent)] px-4 text-sm font-semibold text-black transition hover:bg-[#98ffc3]"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-8 md:py-14">
        <section className="display-card rounded-3xl p-8 md:p-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">Live Taskly Control</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              The task management model built for shipping velocity.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base text-zinc-300 md:text-lg">
              Taskly combines clear workflow structure, strong auth boundaries, and fast operational
              controls into a single product experience designed to help teams move from idea to done
              with less friction.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/12 bg-black/35 p-4 text-left">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Execution</p>
                <p className="mt-2 text-sm text-zinc-200">
                  Create, prioritize, and close tasks from one operator-grade control desk.
                </p>
              </article>
              <article className="rounded-2xl border border-white/12 bg-black/35 p-4 text-left">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Reliability</p>
                <p className="mt-2 text-sm text-zinc-200">
                  Session-guarded architecture keeps management surfaces scoped to authenticated users.
                </p>
              </article>
              <article className="rounded-2xl border border-white/12 bg-black/35 p-4 text-left">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Clarity</p>
                <p className="mt-2 text-sm text-zinc-200">
                  High-signal UI patterns make status, progress, and next actions obvious at a glance.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {boardCards.map((card) => (
            <article key={card.title} className="display-card relative rounded-2xl p-5">
              <span className="display-pin absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full" />
              <span className="mb-4 inline-flex rounded-full bg-white/8 px-3 py-1 font-mono text-xs tracking-wider text-zinc-300">
                {card.badge}
              </span>
              <h3 className="mb-2 text-lg font-medium">{card.title}</h3>
              <p className="text-sm text-zinc-300">{card.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="display-card rounded-3xl p-7 md:p-10">
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                Task Management Model Preview
              </p>
              <h3 className="text-2xl font-semibold md:text-3xl">
                Animated screenshot-style live desk
              </h3>
            </div>
            <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-mono text-cyan-200">
              VISUAL MODEL
            </span>
          </div>

          <div className="display-card scanline relative overflow-hidden rounded-2xl border border-white/15 p-5 md:p-6">
            <span className="shimmer-band" />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-xs text-zinc-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-white">42</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-xs text-zinc-400">In Progress</p>
                <p className="text-2xl font-semibold text-cyan-200">18</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-xs text-zinc-400">Done</p>
                <p className="text-2xl font-semibold text-emerald-200">24</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.3fr,1fr]">
              <div className="space-y-3">
                {[
                  ["Finalize API response contracts", "in-progress"],
                  ["Review auth middleware behavior", "todo"],
                  ["Ship task desk visual polish", "done"],
                ].map(([title, state], idx) => (
                  <div
                    key={title}
                    className="float-y rounded-xl border border-zinc-700 bg-black/50 p-4"
                    style={{ animationDelay: `${idx * 0.25}s` }}
                  >
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-400">{state}</p>
                  </div>
                ))}
              </div>
              <div className="pulse-border rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-200">
                  Productivity Stack
                </p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                  <li>Quick create with status presets</li>
                  <li>One-click done toggle and deletion</li>
                  <li>Fast search, filter, and sort views</li>
                  <li>Auth verify from profile command panel</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {productModels.map((item) => (
            <article key={item.title} className="model-card display-card rounded-2xl p-6">
              <span className="mb-3 inline-flex rounded-full bg-white/8 px-3 py-1 font-mono text-xs tracking-[0.12em] text-zinc-300">
                {item.tag}
              </span>
              <h4 className="mb-2 text-lg font-semibold">{item.title}</h4>
              <p className="text-sm text-zinc-300">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="display-card rounded-3xl p-7 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">Project Detail Map</p>
          <h3 className="mt-3 text-2xl font-semibold">From onboarding to execution in one flow</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Landing Story", "Marketing-first narrative with conversion-focused entry points."],
              ["02", "Signup Route", "Dedicated account creation designed for clean onboarding."],
              ["03", "Login Route", "Auth gate that validates and forwards to protected workspace."],
              ["04", "Task Desk", "High-speed management model with rich operator controls."],
            ].map(([step, title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="font-mono text-xs text-zinc-400">{step}</p>
                <h4 className="mt-2 font-semibold">{title}</h4>
                <p className="mt-2 text-sm text-zinc-300">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 md:px-8 md:pb-14">
        <section className="display-card rounded-2xl border border-white/10 bg-black/35 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-300">
              Created and maintained by{" "}
              <a
                href="https://x.com/akshxdevs"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-200 transition hover:text-cyan-100"
              >
                akshxdevs
              </a>
              .
            </p>
            <a
              href="https://github.com/akshxdevs/go-taskly"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 bg-white/5 text-zinc-100 transition hover:border-zinc-300 hover:bg-white/10"
            >
              <GitHubIcon />
            </a>
          </div>
        </section>
      </footer>

      {isLoggedIn ? (
        <Link
          href="/tasks"
          aria-label="Task Desk"
          title="Task Desk"
          className="fixed bottom-6 right-6 z-30 inline-flex h-10 items-center justify-center rounded-full bg-[var(--btn-accent)] px-3 text-xs font-semibold text-black shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition hover:scale-105 hover:bg-[#98ffc3]"
        >
          Task
        </Link>
      ) : null}
    </AppBackground>
  );
}
