export type ScreeningErrorKind = "network" | "server" | "badResponse" | "unknown";

/**
 * Error raised by the screening client. It carries only a kind and an HTTP status,
 * never the raw server message: the UI shows a translated, safe sentence for each kind.
 */
export class ScreeningError extends Error {
  readonly kind: ScreeningErrorKind;
  readonly status?: number;

  constructor(kind: ScreeningErrorKind, status?: number) {
    super(kind);
    this.name = "ScreeningError";
    this.kind = kind;
    this.status = status;
  }
}

/** True for the error `fetch` and the mock throw when an AbortController cancels a request. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
