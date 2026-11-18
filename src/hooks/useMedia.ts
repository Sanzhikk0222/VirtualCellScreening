import { useCallback, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

/** Subscribes to a CSS media query. Returns false on the server and before the first paint. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** A mouse or trackpad is the main pointer, so hover effects make sense. */
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

/** Phones and small tablets: lighter effects, simpler layouts. */
export const useIsNarrow = () => useMediaQuery("(max-width: 767px)");

/** The visitor asked the system for less motion. Every animated component checks this. */
export function useReduced(): boolean {
  return useReducedMotion() ?? false;
}
