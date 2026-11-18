import { useCallback, useEffect, useRef, useState } from "react";
import { screen } from "@/lib/api";
import { isAbortError, ScreeningError } from "@/lib/errors";
import type { ScreeningRequest, ScreeningResult } from "@/lib/types";

export type ScreeningState =
  | { status: "idle" }
  | { status: "loading"; progress: number; stage: number }
  | { status: "success"; result: ScreeningResult }
  | { status: "error"; error: ScreeningError };

/**
 * State machine for one screening: idle, loading, success or error.
 *
 * While the request is in flight the progress eases toward 92% and steps through `stageCount`
 * pipeline stages. The stages describe the pipeline; their timing is an estimate, because the
 * API returns one answer when it is done.
 */
export function useScreening(stageCount: number) {
  const [state, setState] = useState<ScreeningState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    stopTimer();
    setState({ status: "idle" });
  }, [stopTimer]);

  const run = useCallback(
    async (request: ScreeningRequest) => {
      controllerRef.current?.abort();
      stopTimer();

      const runId = ++runIdRef.current;
      const controller = new AbortController();
      controllerRef.current = controller;

      let progress = 4;
      setState({ status: "loading", progress, stage: 0 });
      timerRef.current = window.setInterval(() => {
        progress += (92 - progress) * 0.07;
        const stage = Math.min(stageCount - 1, Math.floor((progress / 92) * stageCount));
        setState((current) =>
          current.status === "loading" ? { status: "loading", progress, stage } : current,
        );
      }, 140);

      try {
        const result = await screen(request, controller.signal);
        if (runId !== runIdRef.current) return;
        stopTimer();
        // Let the bar reach 100% before the result replaces it.
        setState({ status: "loading", progress: 100, stage: stageCount - 1 });
        await new Promise((resolve) => window.setTimeout(resolve, 260));
        if (runId !== runIdRef.current) return;
        setState({ status: "success", result });
      } catch (error) {
        if (runId !== runIdRef.current || isAbortError(error)) return;
        stopTimer();
        setState({
          status: "error",
          error: error instanceof ScreeningError ? error : new ScreeningError("unknown"),
        });
      }
    },
    [stageCount, stopTimer],
  );

  // Cancel any request still running when the component goes away.
  useEffect(
    () => () => {
      runIdRef.current += 1;
      controllerRef.current?.abort();
      stopTimer();
    },
    [stopTimer],
  );

  return { state, run, cancel };
}
