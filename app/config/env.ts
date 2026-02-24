export const env = {
  tasklyApiUrl: process.env.NEXT_PUBLIC_TASKLY_API_URL ?? "http://localhost:8080",
} as const;
