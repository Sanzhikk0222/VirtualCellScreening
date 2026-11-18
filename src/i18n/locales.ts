import type { Dictionary } from "./dictionary";
import { en } from "./en";
import { kk } from "./kk";
import { ru } from "./ru";

export const LOCALES = ["en", "ru", "kk"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "vcs-locale";

export const dictionaries: Record<Locale, Dictionary> = { en, ru, kk };

/** `short` goes on the switcher button, `native` is the language's own name (used as the accessible label). */
export const LOCALE_LABELS: Record<Locale, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  ru: { short: "РУ", native: "Русский" },
  kk: { short: "ҚАЗ", native: "Қазақша" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Maps a BCP 47 tag such as "kk-KZ" or "ru-RU" to a supported locale. */
function fromTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split("-")[0];
  return isLocale(base) ? base : null;
}

/**
 * Picks the starting language. Order: ?lang= in the URL (shareable links), the saved choice,
 * the browser's language list, then English. Safe to call before the DOM is ready.
 */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const fromUrl = fromTag(new URLSearchParams(window.location.search).get("lang"));
    if (fromUrl) return fromUrl;
  } catch {
    /* ignore a malformed URL */
  }

  try {
    const stored = fromTag(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* storage can be blocked (private mode, strict cookie settings) */
  }

  for (const tag of window.navigator.languages ?? [window.navigator.language]) {
    const match = fromTag(tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
