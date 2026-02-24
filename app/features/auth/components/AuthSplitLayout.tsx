import type { ReactNode } from "react";
import { AppBackground } from "@/components/layout";

type AuthSplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function AuthSplitLayout({ left, right }: AuthSplitLayoutProps) {
  return (
    <AppBackground>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10 md:px-8">
        <section className="grid w-full gap-6 md:grid-cols-2">
          {left}
          {right}
        </section>
      </main>
    </AppBackground>
  );
}
