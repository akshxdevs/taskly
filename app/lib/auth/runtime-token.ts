let runtimeAuthToken: string | null = null;

export function setRuntimeAuthToken(token: string): void {
  runtimeAuthToken = token;
}

export function getRuntimeAuthToken(): string {
  return runtimeAuthToken ?? "";
}

export function clearRuntimeAuthToken(): void {
  runtimeAuthToken = null;
}
