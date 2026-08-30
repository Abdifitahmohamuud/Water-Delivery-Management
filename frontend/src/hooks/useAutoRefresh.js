import { useEffect, useRef } from "react";

/**
 * Custom hook for silent real-time streaming auto-refresh
 * Automatically revalidates page state every X milliseconds without showing full page loader.
 */
export function useAutoRefresh(callback, intervalMs = 4000) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (savedCallback.current && typeof savedCallback.current === "function") {
        savedCallback.current();
      }
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export default useAutoRefresh;
