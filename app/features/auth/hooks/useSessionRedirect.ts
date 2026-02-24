import { useEffect } from "react";
import { readSession } from "@/lib/auth";

export function useSessionRedirect(onAuthenticated: () => void): void {
  useEffect(() => {
    const activeSession = readSession();
    if (activeSession?.user?.id) {
      onAuthenticated();
    }
  }, [onAuthenticated]);
}
