import type { CellLineId, CompoundId } from "./types";

/*
 * Public records a reader can open to check a result against something other than this page.
 * These links do not make a demo number true: they point to independent sources about the
 * compound and the cell line, so the claims behind a result can be looked up.
 */

/** PubChem search for a preset drug by name, or for a custom structure by its SMILES. */
export function compoundReferenceUrl(compoundId: CompoundId | undefined, smiles: string): string {
  const query = compoundId ?? smiles;
  return `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(query)}`;
}

/** Cellosaurus entry of each cell line (the standard registry of cell lines). */
export const CELL_LINE_REFERENCES: Record<CellLineId, string> = {
  "MDA-MB-231": "https://www.cellosaurus.org/CVCL_0062",
  HepG2: "https://www.cellosaurus.org/CVCL_0027",
  HeLa: "https://www.cellosaurus.org/CVCL_0030",
};

/** Where the page explains how the model is validated and what it cannot do. */
export const METHOD_URL = "#science";
