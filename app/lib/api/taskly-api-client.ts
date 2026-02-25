import { env } from "@/config";
import type { LoginResponse, Task, User, UserAuth } from "@/types";
import { parseResponse } from "./http-client";

function api(path: string): string {
  return `${env.tasklyApiUrl}${path}`;
}

export async function signupUserApi(email: string, password: string): Promise<User> {
  return parseResponse<User>(
    await fetch(api("/api/v1/user/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function loginUserApi(email: string, password: string): Promise<LoginResponse> {
  return parseResponse<LoginResponse>(
    await fetch(api("/api/v1/user/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function fetchUserAuthApi(userId: string): Promise<UserAuth> {
  return parseResponse<UserAuth>(
    await fetch(api(`/api/v1/user/auth/${userId}`), {
      method: "GET",
    }),
  );
}

export async function fetchTasksApi(token: string,userId:string): Promise<Task[]> {
  return parseResponse<Task[]>(
    await fetch(api(`/api/v1/tasks/${userId}`), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function createTaskApi(
  token: string,
  payload: Pick<Task, "title" | "description" | "status" |"userId">,
): Promise<Task> {
  return parseResponse<Task>(
    await fetch(api("/api/v1/tasks"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateTaskStatusApi(
  token: string,
  id: number,
  status: string,
): Promise<Task> {
  return parseResponse<Task>(
    await fetch(api(`/api/v1/tasks/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }),
  );
}

export async function deleteTaskApi(token: string, id: number): Promise<string> {
  return parseResponse<string>(
    await fetch(api(`/api/v1/tasks/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}
