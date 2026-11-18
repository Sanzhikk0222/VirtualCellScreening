import type { Dictionary } from "@/i18n/dictionary";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { PATHWAY_IDS, type PathwayEffect, type PathwayId } from "@/lib/types";

/*
 * Colours for "flux went down" and "flux went up". A drop in a pathway is usually the intended
 * effect of a drug, so the pair is blue and coral (direction), not red and green (good and bad).
 * Direction is never carried by colour alone: every bar also has a sign, an arrow and a label.
 */
export const DECREASE_COLOR = "#5b9dff";
export const INCREASE_COLOR = "#ff8f70";

export const deltaColor = (value: number): string => (value < 0 ? DECREASE_COLOR : INCREASE_COLOR);

const KNOWN_PATHWAYS = new Set<string>(PATHWAY_IDS);

/** Translated pathway name. A pathway id the page does not know falls back to the backend's English name. */
export function pathwayLabel(t: Dictionary, effect: PathwayEffect): string {
  return KNOWN_PATHWAYS.has(effect.id) ? t.demo.pathways[effect.id as PathwayId] : effect.name;
}

/** "−58%" or "+24%": a real minus sign and the locale's number format. */
export function formatDelta(locale: Locale, value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatNumber(locale, Math.abs(value))}%`;
}
