import { Suspense } from "react";
import { LoginPage } from "@/features/auth";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <LoginPage />
    </Suspense>
  );
}
