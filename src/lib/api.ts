import { isAbortError, ScreeningError } from "./errors";
import { mockScreen } from "./mockScreening";
import { ScreeningResultSchema } from "./schema";
import type { ScreeningRequest, ScreeningResult } from "./types";

/** "mock" (default) answers in the browser; "live" calls the FastAPI backend. */
export const API_MODE: "mock" | "live" = import.meta.env.VITE_API_MODE === "live" ? "live" : "mock";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/**
 * Runs one screening.
 *
 * Contract (the backend must match it):
 *   POST {API_BASE}/api/screen
 *   body     ScreeningRequest   { cellLine, smiles, compoundId? }
 *   200 body ScreeningResult    validated by ScreeningResultSchema
 *
 * Failures are normalised to ScreeningError; the page shows a translated message per kind.
 */
export async function screen(
  request: ScreeningRequest,
  signal?: AbortSignal,
): Promise<ScreeningResult> {
  if (API_MODE === "mock") return mockScreen(request, signal);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ScreeningError("network");
  }

  if (!response.ok) throw new ScreeningError("server", response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ScreeningError("badResponse");
  }

  const parsed = ScreeningResultSchema.safeParse(body);
  if (!parsed.success) throw new ScreeningError("badResponse");
  return parsed.data;
}
