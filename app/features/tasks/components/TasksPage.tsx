"use client";

import Link from "next/link";
import { AppBackground } from "@/components/layout";
import { CheckIcon, DeskIcon, LogoutIcon, RefreshIcon } from "@/features/tasks/components/icons";
import { TASK_STATUS_OPTIONS } from "@/features/tasks/constants";
import { useTasksPage } from "@/features/tasks/hooks/useTasksPage";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8l4 4 4-4" />
    </svg>
  );
}

export function TasksPage() {
  const {
    session,
    authData,
    isBooting,
    isLoading,
    statusMessage,
    isProfileMenuOpen,
    isAuthChecking,
    authVerifiedFlash,
    newTitle,
    newDescription,
    newStatus,
    taskQuery,
    taskFilter,
    isCreateDialogOpen,
    toastMessage,
    totalTasks,
    doneTasks,
    activeTasks,
    visibleTasks,
    setIsProfileMenuOpen,
    setTaskQuery,
    setTaskFilter,
    setIsCreateDialogOpen,
    setNewTitle,
    setNewDescription,
    setNewStatus,
    loadTasks,
    updateTaskEntryStatus,
    deleteTaskEntry,
    checkAuth,
    handleLogout,
    handleCreateTaskFromDialog,
  } = useTasksPage();

  if (isBooting) {
    return (
      <AppBackground>
        <div className="flex min-h-screen items-center justify-center text-foreground">
          <p className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-300">
            Opening task desk...
          </p>
        </div>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Go to main page"
              title="Go to main page"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-200 transition hover:scale-105 hover:border-cyan-200/60"
            >
              <DeskIcon />
            </Link>
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-zinc-400">TASKLY DESK</p>
              <h1 className="text-xl font-semibold tracking-tight">Live Task Management</h1>
              <p className="text-xs text-zinc-400">Create, verify, and manage tasks in one control view.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="relative"
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <button
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-600 bg-white/5 px-3 text-zinc-100 transition hover:border-zinc-300"
                aria-label="Profile menu"
                title="Profile"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
              >
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-black">
                  {session?.user?.username?.slice(0, 2).toUpperCase() || "NA"}
                  {isAuthChecking ? (
                    <span className="absolute -bottom-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-900">
                      <span className="h-2 w-2 animate-spin rounded-full border border-zinc-200 border-t-transparent" />
                    </span>
                  ) : authData?.is_user_authenticated || authVerifiedFlash ? (
                    <span className="absolute -bottom-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-500 text-white">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                      {authVerifiedFlash ? (
                        <span className="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-emerald-400/60" />
                      ) : null}
                    </span>
                  ) : authData ? (
                    <span className="absolute -bottom-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-red-200 bg-red-500 text-white">
                      <span className="text-[8px] leading-none">!</span>
                    </span>
                  ) : null}
                </span>
                <span className="max-w-20 truncate text-xs font-medium">{session?.user?.username}</span>
              </button>
              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-10 z-30 min-w-44 rounded-xl border border-zinc-700 bg-zinc-950/95 p-1 shadow-xl backdrop-blur">
                  <button
                    className={`inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 ${
                      authData?.is_user_authenticated
                        ? "text-emerald-200"
                        : authData
                          ? "text-red-200"
                          : "text-zinc-100"
                    }`}
                    onClick={() => void checkAuth()}
                  >
                    {isAuthChecking ? (
                      <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : (
                      <CheckIcon />
                    )}
                    <span>{isAuthChecking ? "Verifying..." : "Verify Auth"}</span>
                  </button>
                  <button
                    className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
                    onClick={handleLogout}
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-8 md:py-14">
        <section className="display-card task-desk-shell rounded-3xl p-6 md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">TASK DESK</p>
              <h3 className="text-2xl font-semibold">Quick access task management</h3>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 text-zinc-100 transition hover:rotate-45 hover:border-zinc-300"
              onClick={() => void loadTasks()}
              aria-label="Refresh tasks"
              title="Refresh tasks"
            >
              <RefreshIcon />
            </button>
          </div>

          <p className="mb-4 rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs text-zinc-300">
            Status: {isLoading ? "Working..." : statusMessage}
          </p>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="stat-tile rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Total</p>
              <p className="text-2xl font-semibold">{totalTasks}</p>
            </div>
            <div className="stat-tile rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Active</p>
              <p className="text-2xl font-semibold">{activeTasks}</p>
            </div>
            <div className="stat-tile rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Done</p>
              <p className="text-2xl font-semibold">{doneTasks}</p>
            </div>
          </div>

          <div className="mb-5">
            <button
              className="create-btn-glow w-full rounded-full bg-[var(--btn-accent)] px-6 py-3 text-sm font-semibold text-black"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Todo
            </button>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-200">Latest tasks appear first</p>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              className="w-full rounded-xl border border-zinc-700 bg-black/45 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-300 md:flex-1"
              placeholder="Search tasks..."
              value={taskQuery}
              onChange={(event) => setTaskQuery(event.target.value)}
            />
            <div className="relative w-full md:flex-1">
              <select
                className="h-10 w-full appearance-none rounded-xl border border-zinc-700 bg-black/45 px-4 pr-10 text-sm leading-none outline-none transition focus:border-zinc-300"
                value={taskFilter}
                onChange={(event) => setTaskFilter(event.target.value)}
              >
                <option value="all">All status</option>
                {TASK_STATUS_OPTIONS.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {visibleTasks.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-zinc-400">
                No matching tasks found.
              </p>
            ) : (
              visibleTasks.map((task, index) => (
                <article
                  key={task.id}
                  className="task-row flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black/40 p-4 md:flex-row md:items-center md:justify-between"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-zinc-400">{task.description || "No description"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-200">
                      {task.status}
                    </span>
                    <button
                      className="rounded-full border border-zinc-600 px-3 py-1 text-xs transition hover:border-zinc-300"
                      onClick={() =>
                        void updateTaskEntryStatus(task.id, task.status === "done" ? "todo" : "done")
                      }
                    >
                      Toggle done
                    </button>
                    <button
                      className="rounded-full border border-red-500/60 px-3 py-1 text-xs text-red-200 transition hover:border-red-300"
                      onClick={() => void deleteTaskEntry(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {isCreateDialogOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 px-4">
          <div className="dialog-pop w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Create Task</h4>
              <button
                className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-200 transition hover:border-zinc-300"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <input
                className="rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
                placeholder="Task title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleCreateTaskFromDialog();
                }}
              />
              <input
                className="rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
                placeholder="Description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-zinc-700 bg-black/45 px-4 pr-10 text-sm leading-none outline-none transition focus:border-zinc-300"
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                >
                  {TASK_STATUS_OPTIONS.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <ChevronDownIcon />
                </span>
              </div>
              <button
                className="create-btn-glow mt-1 rounded-full bg-[var(--btn-accent)] px-6 py-3 text-sm font-semibold text-black"
                onClick={() => void handleCreateTaskFromDialog()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="toast-pop fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-300/50 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur">
          {toastMessage}
        </div>
      ) : null}
    </AppBackground>
  );
}
