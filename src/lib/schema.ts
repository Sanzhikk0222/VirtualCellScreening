import { z } from "zod";
import { CELL_LINES, COMPOUND_IDS, type ScreeningResult } from "./types";

const PathwayEffectSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  deltaFlux: z.number().min(-100).max(1000),
});

/**
 * Runtime check for the body of POST /api/screen. The page never trusts the network:
 * anything that does not match is shown as a "bad response" error instead of crashing a chart.
 */
export const ScreeningResultSchema = z.object({
  requestId: z.string().min(1).max(64),
  cellLine: z.enum(CELL_LINES),
  compound: z.object({
    smiles: z.string().max(500),
    compoundId: z.enum(COMPOUND_IDS).optional(),
  }),
  growthInhibitionPct: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  topPathways: z.array(PathwayEffectSchema).min(1).max(10),
  profile: z.array(PathwayEffectSchema).min(1).max(24),
  model: z.object({ name: z.string().max(80), version: z.string().max(40) }),
  runtimeMs: z.number().min(0),
  synthetic: z.boolean(),
});

/** Compile-time guard: the schema and the hand-written interface must describe the same shape. */
export function parseScreeningResult(data: unknown): ScreeningResult {
  return ScreeningResultSchema.parse(data);
}
