import { CatmullRomCurve3, Euler, Vector3 } from "three";
import { seeded } from "@/lib/random";
import type { OrganelleId } from "@/lib/types";
import { ORGANELLE_COLORS } from "./organelleColors";

/** Scene units. The membrane is a sphere of this radius, centred on the origin. */
export const CELL_RADIUS = 2;
/** Camera distance that frames the whole cell. */
export const DEFAULT_DISTANCE = 7.2;
export const MIN_DISTANCE = 1.4;
export const MAX_DISTANCE = 10;

export interface OrganelleMeta {
  /** Accent colour, also used for the organelle chips in the page UI. */
  color: string;
  /** Point the camera looks at when this organelle is selected. */
  focus: [number, number, number];
  /** Camera distance from the focus point. */
  distance: number;
  /**
   * "radial": the camera swings round to the outside of the cell, facing the organelle.
   * "keep": the camera keeps its current viewing direction and only moves closer (central organelles).
   */
  approach: "radial" | "keep";
}

export const ORGANELLE_META: Record<OrganelleId, OrganelleMeta> = {
  membrane: {
    color: ORGANELLE_COLORS.membrane,
    focus: [0, 0.2, 2.0],
    distance: 3.4,
    approach: "radial",
  },
  nucleus: {
    color: ORGANELLE_COLORS.nucleus,
    focus: [-0.15, 0.15, 0],
    distance: 3.3,
    approach: "keep",
  },
  mitochondria: {
    color: ORGANELLE_COLORS.mitochondria,
    focus: [0.2, -0.37, 0.58],
    distance: 3.6,
    approach: "radial",
  },
  er: { color: ORGANELLE_COLORS.er, focus: [-0.15, 0.15, 0], distance: 3.1, approach: "keep" },
  golgi: {
    color: ORGANELLE_COLORS.golgi,
    focus: [1.05, -0.1, -0.35],
    distance: 2.6,
    approach: "radial",
  },
  ribosomes: {
    color: ORGANELLE_COLORS.ribosomes,
    focus: [-0.3, 0.5, 1.15],
    distance: 2.8,
    approach: "radial",
  },
};

/** Nucleus centre. The ER and its ribosomes are built around it. */
export const NUCLEUS_POSITION: [number, number, number] = [-0.15, 0.15, 0];

export interface MitochondrionPlacement {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export const MITOCHONDRIA: MitochondrionPlacement[] = [
  { position: [1.05, 0.55, 0.55], rotation: [0.3, 0.2, 1.1], scale: 1 },
  { position: [-1.0, -0.65, 0.75], rotation: [0.9, 0.1, -0.7], scale: 0.9 },
  { position: [0.55, -1.0, 0.45], rotation: [0.2, 0.6, 0.4], scale: 1.05 },
  { position: [-0.75, 1.0, -0.4], rotation: [1.2, 0.3, 0.2], scale: 0.85 },
];

/**
 * Rough ER: five wavy loops wrapped round the nucleus at slightly different radii and tilts.
 * Built once at import time; the seed keeps the shape identical on every load.
 */
function buildErLoops(): CatmullRomCurve3[] {
  const random = seeded(7);
  const loops: CatmullRomCurve3[] = [];
  for (let k = 0; k < 5; k += 1) {
    const phase = random() * Math.PI * 2;
    const tilt = new Euler(random() * Math.PI, random() * Math.PI * 2, 0);
    const points: Vector3[] = [];
    const steps = 28;
    for (let i = 0; i < steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = 0.92 + 0.1 * Math.sin(angle * 3 + phase) + k * 0.035;
      const height = 0.22 * Math.sin(angle * 2 + phase * 1.7);
      points.push(
        new Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius).applyEuler(tilt),
      );
    }
    loops.push(new CatmullRomCurve3(points, true, "catmullrom", 0.5));
  }
  return loops;
}

export const ER_LOOPS = buildErLoops();

/**
 * Ribosome positions (x, y, z per point): about half sit on the ER, the rest float free
 * in the cytoplasm, kept clear of the nucleus and the mitochondria.
 */
function buildRibosomes(): Float32Array {
  const random = seeded(21);
  const points: number[] = [];
  const nucleus = new Vector3(...NUCLEUS_POSITION);

  for (const loop of ER_LOOPS) {
    for (let i = 0; i < 14; i += 1) {
      const p = loop.getPointAt(i / 14);
      points.push(
        p.x + nucleus.x + (random() - 0.5) * 0.12,
        p.y + nucleus.y + (random() - 0.5) * 0.12,
        p.z + nucleus.z + (random() - 0.5) * 0.12,
      );
    }
  }

  const candidate = new Vector3();
  let free = 0;
  let attempts = 0;
  while (free < 70 && attempts < 2000) {
    attempts += 1;
    candidate.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).multiplyScalar(1.75);
    if (candidate.length() > 1.75) continue;
    if (candidate.distanceTo(nucleus) < 1.3) continue;
    if (MITOCHONDRIA.some((m) => candidate.distanceTo(new Vector3(...m.position)) < 0.6)) continue;
    points.push(candidate.x, candidate.y, candidate.z);
    free += 1;
  }
  return new Float32Array(points);
}

export const RIBOSOME_POINTS = buildRibosomes();
