import { useEffect, useState } from "react";

/**
 * Turns true once the browser is idle (or after `timeout` ms at the latest).
 * Heavy things such as the WebGL canvas wait for it, so the first paint and the text come first.
 */
export function useIdleMount(timeout = 1500): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Safari has no requestIdleCallback, so look it up at run time instead of narrowing `window`.
    const idle = (window as Window & typeof globalThis).requestIdleCallback as
      | ((callback: () => void, options?: { timeout: number }) => number)
      | undefined;
    if (typeof idle === "function") {
      const id = idle.call(window, () => setReady(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(id);
  }, [timeout]);

  return ready;
}
