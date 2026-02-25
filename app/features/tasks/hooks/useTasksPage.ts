import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearSession, getRuntimeAuthToken, readSession, setRuntimeAuthToken } from "@/lib/auth";
import { useTimedFlag } from "@/hooks";
import type { Session, Task, UserAuth } from "@/types";
import { fetchUserAuth, fetchUserAuthWithRetry } from "@/features/auth";
import { createTask, deleteTask, fetchTasks, updateTaskStatus } from "@/features/tasks/services/tasks-service";

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

export function useTasksPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authData, setAuthData] = useState<UserAuth | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Preparing task desk...");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [authVerifiedFlash, triggerAuthVerifiedFlash] = useTimedFlag(1200);

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
    void (async () => {
      setIsLoading(true);
      setStatusMessage("Verifying auth...");
      const runtimeToken = getRuntimeAuthToken();

      try {
        if (runtimeToken) {
          setAccessToken(runtimeToken);
        }

        const authResponse = await fetchUserAuthWithRetry(activeSession.user.id, 4, 300);
        if (!authResponse?.is_user_authenticated || !authResponse?.token) {
          if (!runtimeToken) {
            clearSession();
            router.replace("/login");
          }
          return;
        }

        setAuthData(authResponse);
        setAccessToken(authResponse.token);
        setUserId(authResponse.id);
        setRuntimeAuthToken(authResponse.token);

        setStatusMessage("Loading tasks...");
        const response = await fetchTasks(authResponse.token, authResponse.id);
        setTasks(sortTasksNewestFirst(response));
        setStatusMessage(`Loaded ${response.length} task(s).`);
      } catch (error) {
        if (!runtimeToken) {
          clearSession();
          router.replace("/login");
          return;
        }
        setStatusMessage(`Auth verification failed: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
        setIsBooting(false);
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

  async function loadTasks(activeToken = accessToken) {
    if (!activeToken) return;

    setIsLoading(true);
    setStatusMessage("Loading tasks...");

    try {
      const response = await fetchTasks(activeToken,userId);
      setTasks(sortTasksNewestFirst(response));
      setStatusMessage(`Loaded ${response.length} task(s).`);
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTaskEntry() {
    if (!accessToken) return false;
    if (!newTitle.trim()) {
      setStatusMessage("Task title is required.");
      return false;
    }

    setIsLoading(true);
    setStatusMessage("Creating task...");

    try {
      const createdTask = await createTask(accessToken, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
        userId:userId
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

  async function handleCreateTaskFromDialog() {
    const created = await createTaskEntry();
    if (!created) return;
    setIsCreateDialogOpen(false);
    setToastMessage("Task created");
    setTimeout(() => setToastMessage(""), 1800);
  }

  async function updateTaskEntryStatus(id: number, nextStatus: string) {
    if (!accessToken) return;

    setIsLoading(true);
    setStatusMessage("Updating task...");

    try {
      const updatedTask = await updateTaskStatus(accessToken, id, nextStatus);
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

  async function deleteTaskEntry(id: number) {
    if (!accessToken) return;

    setIsLoading(true);
    setStatusMessage("Deleting task...");

    try {
      await deleteTask(accessToken, id);
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
      if (response.token) {
        setAccessToken(response.token);
        setRuntimeAuthToken(response.token);
      }
      if (response.is_user_authenticated) {
        triggerAuthVerifiedFlash();
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsAuthChecking(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return {
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
  };
}
