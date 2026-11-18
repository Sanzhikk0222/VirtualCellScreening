import { ArrowUp, BookOpen, Github, Mail } from "lucide-react";
import { site } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";
import { interpolate } from "@/i18n/format";
import { LogoMark } from "@/components/ui/Logo";

const OPEN_SOURCE_STACK = [
  "React",
  "Three.js",
  "Framer Motion",
  "Recharts",
  "Tailwind CSS",
  "COBRApy",
  "Recon3D",
];

export function Footer() {
  const { t } = useI18n();
  const links = [
    { href: site.githubUrl, label: t.footer.github, icon: Github, external: true },
    {
      href: site.docsUrl,
      label: t.footer.docs,
      icon: BookOpen,
      external: site.docsUrl.startsWith("http"),
    },
    {
      href: site.contactUrl,
      label: t.footer.contact,
      icon: Mail,
      external: site.contactUrl.startsWith("http"),
    },
  ];

  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr] md:py-16">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="size-8" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Virtual Cell Screening
            </span>
          </div>
          <p className="mt-4 max-w-md text-fg-muted">{t.footer.tagline}</p>
          <p className="mt-6 max-w-md text-sm text-fg-muted">{t.footer.openSource}</p>
          <p className="mt-2 max-w-md text-sm text-fg-muted">{OPEN_SOURCE_STACK.join(", ")}.</p>
        </div>

        <ul className="flex flex-col gap-1 md:items-end">
          {links.map(({ href, label, icon: Icon, external }) => (
            <li key={label}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group inline-flex min-h-11 items-center gap-3 rounded-full px-1 text-fg-muted transition-colors hover:text-fg"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4.5 transition-colors group-hover:text-aqua-400"
                />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-sm text-fg-muted sm:flex-row sm:items-center sm:px-8">
          <p>{interpolate(t.footer.rights, { year: new Date().getFullYear() })}</p>
          <a
            href="#top"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 transition-colors hover:text-fg"
          >
            <ArrowUp aria-hidden="true" className="size-4" />
            {t.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}
