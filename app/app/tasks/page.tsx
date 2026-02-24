"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type Session,
  type Task,
  type UserAuth,
  clearSession,
  createTaskRequest,
  deleteTaskRequest,
  fetchTasks,
  fetchUserAuth,
  readSession,
  updateTaskStatusRequest,
} from "@/lib/taskly";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M9 4h10v16H9" />
    </svg>
  );
}

function getRecentTimestamp(task: Task): number {
  const createdAt = Date.parse(task.created_at);
  if (Number.isFinite(createdAt)) return createdAt;

  const updatedAt = Date.parse(task.updated_at);
  if (Number.isFinite(updatedAt)) return updatedAt;

  return task.id;
}

function sortTasksNewestFirst(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    const byDate = getRecentTimestamp(b) - getRecentTimestamp(a);
    if (byDate !== 0) return byDate;
    return b.id - a.id;
  });
}

export default function TasksPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authData, setAuthData] = useState<UserAuth | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Preparing task desk...");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [authVerifiedFlash, setAuthVerifiedFlash] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("todo");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const activeSession = readSession();
    if (!activeSession) {
      router.replace("/login");
      return;
    }

    setSession(activeSession);
    setIsBooting(false);

    void (async () => {
      setIsLoading(true);
      setStatusMessage("Loading tasks...");
      try {
        const response = await fetchTasks(activeSession.token);
        setTasks(sortTasksNewestFirst(response));
        setStatusMessage(`Loaded ${response.length} task(s).`);
      } catch (error) {
        setStatusMessage((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status.toLowerCase() === "done").length;
  const activeTasks = totalTasks - doneTasks;

  const visibleTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const byFilter =
        taskFilter === "all" ? true : task.status.toLowerCase() === taskFilter.toLowerCase();
      if (!byFilter) return false;
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)
      );
    });
    return sortTasksNewestFirst(filtered);
  }, [tasks, taskFilter, taskQuery]);

  async function loadTasks(activeToken = session?.token) {
    if (!activeToken) return;

    setIsLoading(true);
    setStatusMessage("Loading tasks...");

    try {
      const response = await fetchTasks(activeToken);
      setTasks(sortTasksNewestFirst(response));
      setStatusMessage(`Loaded ${response.length} task(s).`);
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTask() {
    if (!session?.token) return;
    if (!newTitle.trim()) {
      setStatusMessage("Task title is required.");
      return false;
    }

    setIsLoading(true);
    setStatusMessage("Creating task...");

    try {
      const createdTask = await createTaskRequest(session.token, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
      });
      setNewTitle("");
      setNewDescription("");
      setNewStatus("todo");
      setTaskFilter("all");
      setTaskQuery("");
      setTasks((prev) =>
        sortTasksNewestFirst([createdTask, ...prev.filter((task) => task.id !== createdTask.id)]),
      );
      setStatusMessage("Task created and placed at the top.");
      return true;
    } catch (error) {
      setStatusMessage((error as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 1800);
  }

  async function handleCreateTaskFromDialog() {
    const created = await createTask();
    if (!created) return;
    setIsCreateDialogOpen(false);
    showToast("Task created");
  }

  async function updateTaskStatus(id: number, nextStatus: string) {
    if (!session?.token) return;

    setIsLoading(true);
    setStatusMessage("Updating task...");

    try {
      const updatedTask = await updateTaskStatusRequest(session.token, id, nextStatus);
      setTasks((prev) =>
        sortTasksNewestFirst(prev.map((task) => (task.id === id ? updatedTask : task))),
      );
      setStatusMessage("Task updated.");
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTask(id: number) {
    if (!session?.token) return;

    setIsLoading(true);
    setStatusMessage("Deleting task...");

    try {
      await deleteTaskRequest(session.token, id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setStatusMessage("Task deleted.");
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkAuth() {
    if (!session?.user?.id) return;

    setIsAuthChecking(true);

    try {
      const response = await fetchUserAuth(session.user.id);
      setAuthData(response);
      if (response.is_user_authenticated) {
        setAuthVerifiedFlash(true);
        setTimeout(() => setAuthVerifiedFlash(false), 1200);
      }
    } catch (error) {
      // Keep the status panel focused on task operations only.
      console.error("Auth check failed", error);
    } finally {
      setIsAuthChecking(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (isBooting) {
    return (
      <div className="grain-bg flex min-h-screen items-center justify-center text-foreground">
        <p className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-300">
          Opening task desk...
        </p>
      </div>
    );
  }

  return (
    <div className="grain-bg relative min-h-screen overflow-hidden text-foreground">
      <span className="ambient-orb ambient-orb-a" />
      <span className="ambient-orb ambient-orb-b" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-zinc-400">TASKLY DESK</p>
            <h1 className="text-xl font-semibold tracking-tight">Live Task Management</h1>
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
        <section className="display-card rounded-3xl p-6 md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">TASK DESK</p>
              <h3 className="text-2xl font-semibold">Quick access task management</h3>
            </div>
            <button
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold transition hover:border-zinc-300"
              onClick={() => void loadTasks()}
            >
              Refresh List
            </button>
          </div>

          <p className="mb-4 rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs text-zinc-300">
            Status: {isLoading ? "Working..." : statusMessage}
          </p>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Total</p>
              <p className="text-2xl font-semibold">{totalTasks}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Active</p>
              <p className="text-2xl font-semibold">{activeTasks}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs text-zinc-400">Done</p>
              <p className="text-2xl font-semibold">{doneTasks}</p>
            </div>
          </div>

          <div className="mb-5">
            <button
              className="rounded-full bg-[var(--btn-accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#96ffc1]"
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
            <select
              className="h-10 w-full rounded-xl border border-zinc-700 bg-black/45 px-4 pr-10 text-sm leading-5 outline-none transition focus:border-zinc-300 md:flex-1"
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="todo">todo</option>
              <option value="in-progress">in-progress</option>
              <option value="done">done</option>
            </select>
          </div>

          <div className="space-y-3">
            {visibleTasks.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-zinc-400">
                No matching tasks found.
              </p>
            ) : (
              visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black/40 p-4 md:flex-row md:items-center md:justify-between"
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
                        void updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")
                      }
                    >
                      Toggle done
                    </button>
                    <button
                      className="rounded-full border border-red-500/60 px-3 py-1 text-xs text-red-200 transition hover:border-red-300"
                      onClick={() => void deleteTask(task.id)}
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
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
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
              <select
                className="rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value)}
              >
                <option value="todo">todo</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </select>
              <button
                className="mt-1 rounded-full bg-[var(--btn-accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#96ffc1]"
                onClick={() => void handleCreateTaskFromDialog()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-300/50 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
