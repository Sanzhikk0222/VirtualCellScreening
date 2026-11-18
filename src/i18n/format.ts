import type { Locale } from "./locales";

/** Replaces `{name}` placeholders. Unknown placeholders stay as they are. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const numberFormats = new Map<string, Intl.NumberFormat>();

/** Locale-aware number (decimal comma in Russian and Kazakh). The formatter is cached: counters call this every frame. */
export function formatNumber(locale: Locale, value: number, decimals = 0): string {
  const key = `${locale}:${decimals}`;
  let format = numberFormats.get(key);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      format = new Intl.NumberFormat("en", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    numberFormats.set(key, format);
  }
  return format.format(value);
}

export interface AccentWord {
  word: string;
  accent: boolean;
}

/**
 * Splits a title into words and marks the ones wrapped in [[double brackets]].
 * "Screen on a [[virtual cell]], now" gives virtual and cell the accent flag.
 */
export function parseAccent(text: string): AccentWord[] {
  const words: AccentWord[] = [];
  let accent = false;
  for (const raw of text.split(/\s+/)) {
    if (!raw) continue;
    let word = raw;
    if (word.startsWith("[[")) {
      accent = true;
      word = word.slice(2);
    }
    const close = word.indexOf("]]");
    if (close !== -1) word = word.slice(0, close) + word.slice(close + 2);
    words.push({ word, accent });
    if (close !== -1) accent = false;
  }
  return words;
}

/** The same title without the markers, for aria-label and document metadata. */
export function stripAccent(text: string): string {
  return text.replace(/\[\[|\]\]/g, "");
}
