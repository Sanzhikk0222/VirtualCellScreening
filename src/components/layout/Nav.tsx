import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SECTION_IDS } from "@/config/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LogoMark } from "@/components/ui/Logo";

const LINK_KEYS = ["problem", "cell", "how", "demo", "science"] as const;

/** Sticky top bar: brand, section links with a scroll spy, language switcher and a demo shortcut. */
export function Nav() {
  const { t } = useI18n();
  const active = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The bar gets its frosted surface only once the page has moved.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto mt-3 flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full border px-4 transition-[background-color,border-color,backdrop-filter] duration-300 sm:px-5",
          scrolled || open ? "glass" : "border-transparent",
        )}
        style={{ width: "min(100% - 1.5rem, 80rem)" }}
      >
        <a
          href="#top"
          className="flex items-center gap-2.5 rounded-full"
          aria-label="Virtual Cell Screening"
        >
          <LogoMark />
          <span className="hidden font-display text-[0.95rem] font-semibold tracking-tight sm:inline">
            Virtual Cell Screening
          </span>
        </a>

        <nav aria-label={t.a11y.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINK_KEYS.map((key) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  aria-current={active === key ? "location" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm transition-colors duration-200",
                    active === key ? "bg-white/10 text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {t.nav[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button href="#demo" size="md" className="hidden md:inline-flex">
            {t.nav.cta}
          </Button>
          <button
            type="button"
            className="glass inline-flex size-11 items-center justify-center rounded-full lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.a11y.menu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={t.a11y.mainNav}
          className="glass mx-auto mt-2 rounded-3xl p-3 lg:hidden"
          style={{ width: "min(100% - 1.5rem, 80rem)" }}
        >
          <ul className="flex flex-col">
            {LINK_KEYS.map((key) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === key ? "location" : undefined}
                  className={cn(
                    "flex min-h-12 items-center rounded-2xl px-4 text-base",
                    active === key ? "bg-white/10 text-fg" : "text-fg-muted",
                  )}
                >
                  {t.nav[key]}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <Button href="#demo" onClick={() => setOpen(false)} className="w-full">
                {t.nav.cta}
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
