import { en } from "@/i18n/en";
import { findPresetBySmiles, getPreset, type CompoundPreset } from "./compounds";
import { ScreeningError } from "./errors";
import { hash, seeded } from "./random";
import {
  PATHWAY_IDS,
  type PathwayEffect,
  type PathwayId,
  type ScreeningRequest,
  type ScreeningResult,
} from "./types";

/*
 * Browser-side stand-in for the backend. Every number here is SYNTHETIC.
 * It is deterministic (same input, same output) so a demo looks the same twice,
 * and it returns exactly the shape the real API must return (see ScreeningResultSchema).
 *
 * Test hook: submitting the SMILES text "error" makes the mock fail, to exercise the error state.
 */

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function effect(id: PathwayId, deltaFlux: number): PathwayEffect {
  return { id, name: en.demo.pathways[id], deltaFlux };
}

function byStrength(a: PathwayEffect, b: PathwayEffect): number {
  return Math.abs(b.deltaFlux) - Math.abs(a.deltaFlux);
}

function fromPreset(
  preset: CompoundPreset,
  cellLine: ScreeningRequest["cellLine"],
  rand: () => number,
) {
  const profile = preset.demo.effects.map((item) =>
    // A little per-cell-line variation so the three lines do not look identical.
    effect(item.id, Math.round(item.deltaFlux * (0.86 + rand() * 0.28))),
  );
  return {
    growth: preset.demo.growth[cellLine],
    confidence: 0.74 + rand() * 0.17,
    profile,
  };
}

function fromUnknownStructure(rand: () => number) {
  // Fisher-Yates shuffle driven by the seeded generator.
  const ids = [...PATHWAY_IDS];
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  const profile = ids.slice(0, 6).map((id, index) => {
    const rise = index === 5; // one pathway compensates upwards
    const magnitude = rise ? 4 + rand() * 16 : 8 + rand() * 62;
    return effect(id, Math.round(rise ? magnitude : -magnitude));
  });
  return {
    growth: Math.round(8 + rand() * 64),
    // Structures outside the presets get a lower confidence on purpose.
    confidence: 0.38 + rand() * 0.24,
    profile,
  };
}

export async function mockScreen(
  request: ScreeningRequest,
  signal?: AbortSignal,
): Promise<ScreeningResult> {
  const smiles = request.smiles.trim();
  const rand = seeded(hash(`${request.cellLine}|${smiles}`));
  const delay = 2200 + Math.floor(rand() * 900);

  await wait(delay, signal);

  if (smiles.toLowerCase() === "error") throw new ScreeningError("server", 500);

  const preset = request.compoundId ? getPreset(request.compoundId) : findPresetBySmiles(smiles);
  const base = preset ? fromPreset(preset, request.cellLine, rand) : fromUnknownStructure(rand);
  const profile = [...base.profile].sort(byStrength);

  return {
    requestId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `mock-${hash(smiles).toString(16)}`,
    cellLine: request.cellLine,
    compound: { smiles, compoundId: preset?.id },
    growthInhibitionPct: base.growth,
    confidence: Math.round(base.confidence * 100) / 100,
    topPathways: profile.slice(0, 3),
    profile,
    model: { name: "Recon3D (demo)", version: "synthetic" },
    runtimeMs: delay,
    synthetic: true,
  };
}
