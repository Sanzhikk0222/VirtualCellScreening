import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Dictionary } from "./dictionary";
import { detectLocale, dictionaries, STORAGE_KEY, type Locale } from "./locales";

interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** The active dictionary. Read strings as `t.hero.title`. */
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

function setMetaContent(selector: string, value: string): void {
  document.querySelector(selector)?.setAttribute("content", value);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked; the choice then lasts for this visit only */
    }
    try {
      // Keep the address bar shareable: ?lang=kk opens the page in Kazakh.
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* ignore */
    }
  }, []);

  const t = dictionaries[locale];

  // Keep <html lang>, the tab title and the social-preview tags in step with the language.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.meta.title;
    setMetaContent('meta[name="description"]', t.meta.description);
    setMetaContent('meta[property="og:title"]', t.meta.title);
    setMetaContent('meta[property="og:description"]', t.meta.description);
    setMetaContent('meta[property="og:locale"]', t.meta.ogLocale);
  }, [locale, t]);

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}
