import type { InputHTMLAttributes } from "react";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-700 bg-black/45 px-4 py-3 text-sm outline-none transition focus:border-zinc-300"
      {...props}
    />
  );
}
