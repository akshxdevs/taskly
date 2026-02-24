import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`rounded-full bg-[var(--btn-accent)] px-4 py-3 font-semibold text-black transition hover:bg-[#98ffc3] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
