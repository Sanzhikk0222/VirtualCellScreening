import type { CellLineId, CompoundId, PathwayId } from "./types";

export interface CompoundPreset {
  id: CompoundId;
  smiles: string;
  /** Gene symbols of the known targets. Names and mechanisms are translated in the dictionaries. */
  targets: string[];
  /**
   * SYNTHETIC numbers that give the demo a plausible shape. They are not model output.
   * `growth` is the growth inhibition (%) per cell line; `effects` are flux changes (%) per pathway.
   */
  demo: {
    growth: Record<CellLineId, number>;
    effects: { id: PathwayId; deltaFlux: number }[];
  };
}

export const COMPOUND_PRESETS: CompoundPreset[] = [
  {
    id: "methotrexate",
    smiles: "CN(CC1=CN=C2C(=N1)C(=NC(=N2)N)N)C3=CC=C(C=C3)C(=O)NC(CCC(=O)O)C(=O)O",
    targets: ["DHFR"],
    demo: {
      growth: { "MDA-MB-231": 78, HepG2: 52, HeLa: 71 },
      effects: [
        { id: "folate", deltaFlux: -82 },
        { id: "purine", deltaFlux: -61 },
        { id: "pyrimidine", deltaFlux: -54 },
        { id: "nucleotide", deltaFlux: -33 },
        { id: "glycolysis", deltaFlux: -9 },
        { id: "tca", deltaFlux: -6 },
      ],
    },
  },
  {
    id: "fluorouracil",
    smiles: "C1=C(C(=O)NC(=O)N1)F",
    targets: ["TYMS"],
    demo: {
      growth: { "MDA-MB-231": 64, HepG2: 47, HeLa: 69 },
      effects: [
        { id: "pyrimidine", deltaFlux: -76 },
        { id: "nucleotide", deltaFlux: -48 },
        { id: "folate", deltaFlux: -31 },
        { id: "purine", deltaFlux: -12 },
        { id: "ppp", deltaFlux: -8 },
        { id: "glycolysis", deltaFlux: 5 },
      ],
    },
  },
  {
    id: "metformin",
    smiles: "CN(C)C(=N)N=C(N)N",
    targets: ["Complex I"],
    demo: {
      growth: { "MDA-MB-231": 31, HepG2: 38, HeLa: 27 },
      effects: [
        { id: "oxphos", deltaFlux: -58 },
        { id: "tca", deltaFlux: -37 },
        { id: "glycolysis", deltaFlux: 24 },
        { id: "fao", deltaFlux: -18 },
        { id: "glutamine", deltaFlux: 11 },
        { id: "ppp", deltaFlux: 6 },
      ],
    },
  },
  {
    id: "atorvastatin",
    smiles: "CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",
    targets: ["HMGCR"],
    demo: {
      growth: { "MDA-MB-231": 42, HepG2: 56, HeLa: 36 },
      effects: [
        { id: "cholesterol", deltaFlux: -71 },
        { id: "sphingolipid", deltaFlux: -22 },
        { id: "fao", deltaFlux: 9 },
        { id: "glycolysis", deltaFlux: -7 },
        { id: "tca", deltaFlux: -5 },
        { id: "glutamine", deltaFlux: 4 },
      ],
    },
  },
  {
    id: "hydroxyurea",
    smiles: "C(=O)(N)NO",
    targets: ["RRM1", "RRM2"],
    demo: {
      growth: { "MDA-MB-231": 59, HepG2: 40, HeLa: 63 },
      effects: [
        { id: "nucleotide", deltaFlux: -69 },
        { id: "pyrimidine", deltaFlux: -44 },
        { id: "purine", deltaFlux: -41 },
        { id: "ppp", deltaFlux: 14 },
        { id: "folate", deltaFlux: -10 },
        { id: "glycolysis", deltaFlux: -4 },
      ],
    },
  },
];

export function getPreset(id: CompoundId): CompoundPreset {
  const preset = COMPOUND_PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error(`Unknown compound preset: ${id}`);
  return preset;
}

/** Finds a preset by structure, so pasting a preset's SMILES behaves like picking it. */
export function findPresetBySmiles(smiles: string): CompoundPreset | undefined {
  const needle = smiles.trim();
  return COMPOUND_PRESETS.find((item) => item.smiles === needle);
}
