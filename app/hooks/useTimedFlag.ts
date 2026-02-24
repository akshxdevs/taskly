import { useCallback, useRef, useState } from "react";

export function useTimedFlag(timeoutMs = 1200): [boolean, () => void] {
  const [flag, setFlag] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    setFlag(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setFlag(false);
    }, timeoutMs);
  }, [timeoutMs]);

  return [flag, trigger];
}
