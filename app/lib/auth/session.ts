import type { Session } from "@/types";
import { clearRuntimeAuthToken } from "./runtime-token";

const SESSION_KEY = "taskly_session";

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: session.user }));
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.user?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  clearRuntimeAuthToken();
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
