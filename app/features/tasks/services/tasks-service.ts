import { createTaskApi, deleteTaskApi, fetchTasksApi, updateTaskStatusApi } from "@/lib/api";
import type { Task } from "@/types";

export function fetchTasks(token: string, userId: string): Promise<Task[]> {
  return fetchTasksApi(token,userId);
}

export function createTask(
  token: string,
  payload: Pick<Task, "title" | "description" | "status" | "userId">,
): Promise<Task> {
  return createTaskApi(token, payload);
}

export function updateTaskStatus(token: string, id: number, status: string): Promise<Task> {
  return updateTaskStatusApi(token, id, status);
}

export function deleteTask(token: string, id: number): Promise<string> {
  return deleteTaskApi(token, id);
}
