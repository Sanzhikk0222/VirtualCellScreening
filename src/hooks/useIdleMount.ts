import { useEffect, useState } from "react";

/**
 * Turns true once the browser is idle (or after `timeout` ms at the latest).
 * Heavy things such as the WebGL canvas wait for it, so the first paint and the text come first.
 */
export function useIdleMount(timeout = 1500): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    // Safari has no requestIdleCallback.
    const id = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(id);
  }, [timeout]);

  return ready;
}
