const env = import.meta.env;

// Placeholder used until VITE_GITHUB_URL is set (see .env.example and README).
const github = env.VITE_GITHUB_URL || "https://github.com/your-org/virtual-cell-screening";

/** Site-wide constants. Footer links come from environment variables. */
export const site = {
  name: "Virtual Cell Screening",
  githubUrl: github,
  docsUrl: env.VITE_DOCS_URL || "#science",
  contactUrl: env.VITE_CONTACT_EMAIL
    ? `mailto:${env.VITE_CONTACT_EMAIL}`
    : `${github.replace(/\/$/, "")}/issues`,
  contactLabel: env.VITE_CONTACT_EMAIL || "",
} as const;

/** Anchor ids of the page sections, in page order. Used by the nav and the scroll spy. */
export const SECTION_IDS = ["problem", "cell", "how", "demo", "science"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
