import type { ReactNode } from "react";

type AppBackgroundProps = {
  children: ReactNode;
};

export function AppBackground({ children }: AppBackgroundProps) {
  return (
    <div className="grain-bg relative min-h-screen overflow-hidden text-foreground">
      <span className="ambient-orb ambient-orb-a" />
      <span className="ambient-orb ambient-orb-b" />
      {children}
    </div>
  );
}
