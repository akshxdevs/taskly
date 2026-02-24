import { loginUserApi, signupUserApi, fetchUserAuthApi } from "@/lib/api";
import { delay } from "@/lib/utils";
import type { LoginResponse, User, UserAuth } from "@/types";

export async function signup(email: string, password: string): Promise<User> {
  return signupUserApi(email, password);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return loginUserApi(email, password);
}

export async function fetchUserAuth(userId: string): Promise<UserAuth> {
  return fetchUserAuthApi(userId);
}

export async function fetchUserAuthWithRetry(
  userId: string,
  attempts = 3,
  delayMs = 250,
): Promise<UserAuth> {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchUserAuthApi(userId);
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs);
      }
    }
  }

  throw lastError ?? new Error("Failed to verify auth.");
}
