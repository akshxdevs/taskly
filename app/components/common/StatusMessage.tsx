import type { ReactNode } from "react";

type StatusMessageProps = {
  children: ReactNode;
  className?: string;
};

export function StatusMessage({ children, className = "" }: StatusMessageProps) {
  return (
    <p className={`rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-300 ${className}`}>
      {children}
    </p>
  );
}
