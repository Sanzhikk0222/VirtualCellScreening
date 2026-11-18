import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS } from "@/i18n/locales";
import { cn } from "@/lib/cn";

/**
 * EN / РУ / ҚАЗ switcher. Each button carries its own `lang` so screen readers pronounce the
 * language name correctly, and `aria-pressed` tells which one is active.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.a11y.language}
      className={cn("glass inline-flex items-center rounded-full p-0.5", className)}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={LOCALE_LABELS[code].native}
            title={LOCALE_LABELS[code].native}
            onClick={() => setLocale(code)}
            className={cn(
              "h-11 min-w-11 rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors duration-200 md:h-9",
              active ? "bg-white/12 text-aqua-300" : "text-fg-muted hover:text-fg",
            )}
          >
            {LOCALE_LABELS[code].short}
          </button>
        );
      })}
    </div>
  );
}
