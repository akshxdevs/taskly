export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type UserAuth = {
  id: string;
  username: string;
  email: string;
  auth_status: string;
  is_user_authenticated: boolean;
};

export type LoginResponse = {
  user: User;
  token: string;
};

type ApiError = {
  error?: string;
};

export type Session = {
  user: User;
  token: string;
};

const SESSION_KEY = "taskly_session";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_TASKLY_API_URL ?? "http://localhost:8080";
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJSON = contentType.includes("application/json");

  if (!isJSON) {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `request failed: ${response.status}`);
    }
    return text as T;
  }

  const data = (await response.json()) as T;
  if (!response.ok) {
    const message = (data as ApiError).error || `request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function signupUser(email: string, password: string): Promise<User> {
  return parseResponse<User>(
    await fetch(`${getApiBase()}/api/v1/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return parseResponse<LoginResponse>(
    await fetch(`${getApiBase()}/api/v1/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function fetchUserAuth(userId: string): Promise<UserAuth> {
  return parseResponse<UserAuth>(
    await fetch(`${getApiBase()}/api/v1/user/auth/${userId}`, {
      method: "GET",
    }),
  );
}

export async function fetchTasks(token: string): Promise<Task[]> {
  return parseResponse<Task[]>(
    await fetch(`${getApiBase()}/api/v1/tasks`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export async function createTaskRequest(
  token: string,
  payload: Pick<Task, "title" | "description" | "status">,
): Promise<Task> {
  return parseResponse<Task>(
    await fetch(`${getApiBase()}/api/v1/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateTaskStatusRequest(
  token: string,
  id: number,
  status: string,
): Promise<Task> {
  return parseResponse<Task>(
    await fetch(`${getApiBase()}/api/v1/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }),
  );
}

export async function deleteTaskRequest(token: string, id: number): Promise<string> {
  return parseResponse<string>(
    await fetch(`${getApiBase()}/api/v1/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed?.user?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
