import type { OrganelleId } from "@/lib/types";

/**
 * Accent colour of each organelle. Kept apart from cellData.ts on purpose: this file has no
 * three.js import, so the page UI (organelle chips) can use the colours without pulling the
 * 3D library into the main bundle.
 */
export const ORGANELLE_COLORS: Record<OrganelleId, string> = {
  membrane: "#3fd9c8",
  nucleus: "#5b9dff",
  mitochondria: "#ff8f70",
  er: "#9d8cff",
  golgi: "#ffcf5c",
  ribosomes: "#dfe8ff",
};
