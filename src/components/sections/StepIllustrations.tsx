import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReduced } from "@/hooks/useMedia";
import { cn } from "@/lib/cn";

/*
 * Small animated drawings for the four "How it works" steps. They are decorative (aria-hidden):
 * the step text carries the meaning. Each one plays when its step becomes active and shows its
 * final state straight away when motion is reduced.
 */

interface IllustrationProps {
  active: boolean;
}

/* ------------------------------------------------------------ 1. choose a cell line */

const CELL_LINES = ["MDA-MB-231", "HepG2", "HeLa"];

export function CellLineIllustration({ active }: IllustrationProps) {
  const reduced = useReduced();
  const [index, setIndex] = useState(0);

  // The highlight walks down the list, as if the options were being compared.
  useEffect(() => {
    if (!active || reduced) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % CELL_LINES.length),
      1400,
    );
    return () => window.clearInterval(timer);
  }, [active, reduced]);

  return (
    <ul aria-hidden="true" className="flex h-full flex-col justify-center gap-3">
      {CELL_LINES.map((name, i) => {
        const on = i === index;
        return (
          <li
            key={name}
            className={cn(
              "flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-500",
              on
                ? "border-aqua-400/60 bg-aqua-400/10 shadow-[0_0_30px_-8px_rgb(63_217_200/0.6)]"
                : "border-line bg-white/[0.03]",
            )}
          >
            <span className="relative grid size-10 place-items-center">
              {on && !reduced && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full border border-aqua-400" />
              )}
              <svg viewBox="0 0 32 32" className="size-9" fill="none">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke={on ? "#3fd9c8" : "#98a3c2"}
                  strokeWidth="1.6"
                />
                <circle cx="15" cy="15" r="5" fill={on ? "#5b9dff" : "#4a5578"} />
                <circle cx="22" cy="21" r="2.4" fill={on ? "#ff8f70" : "#4a5578"} />
              </svg>
            </span>
            <span className="font-display text-lg font-medium">{name}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ 2. select a compound */

const SMILES_EXAMPLE = "CN(C)C(=N)N=C(N)N";

// Metformin drawn as a skeletal formula: [x1, y1, x2, y2] bonds, then labelled atoms.
const BONDS: [number, number, number, number][] = [
  [34, 52, 70, 72],
  [70, 72, 70, 112],
  [70, 72, 112, 50],
  [112, 50, 112, 10],
  [108, 50, 108, 10],
  [112, 50, 154, 72],
  [154, 72, 196, 50],
  [196, 50, 238, 72],
  [196, 50, 196, 10],
  [200, 50, 200, 10],
];
const ATOMS: { x: number; y: number; label: string }[] = [
  { x: 70, y: 76, label: "N" },
  { x: 112, y: 46, label: "C" },
  { x: 112, y: 4, label: "NH" },
  { x: 154, y: 76, label: "N" },
  { x: 196, y: 46, label: "C" },
  { x: 198, y: 4, label: "NH" },
  { x: 242, y: 76, label: "NH₂" },
];

export function CompoundIllustration({ active }: IllustrationProps) {
  const reduced = useReduced();
  const [typed, setTyped] = useState(reduced ? SMILES_EXAMPLE.length : 0);

  // Types the SMILES string out each time the step becomes active.
  useEffect(() => {
    if (reduced) {
      setTyped(SMILES_EXAMPLE.length);
      return;
    }
    if (!active) {
      setTyped(0);
      return;
    }
    const timer = window.setInterval(() => {
      setTyped((value) => {
        if (value >= SMILES_EXAMPLE.length) {
          window.clearInterval(timer);
          return value;
        }
        return value + 1;
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [active, reduced]);

  const draw = reduced || active;
  return (
    <div aria-hidden="true" className="flex h-full flex-col items-center justify-center gap-6">
      <svg viewBox="0 0 280 130" className="w-full max-w-sm" fill="none">
        {BONDS.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#eaeefa"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: draw ? 1 : 0, opacity: draw ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : i * 0.12 }}
          />
        ))}
        {ATOMS.map((atom, i) => (
          <motion.text
            key={i}
            x={atom.x}
            y={atom.y}
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            fill={atom.label === "C" ? "#bcc5de" : "#3fd9c8"}
            initial={false}
            animate={{ opacity: draw ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.3 + i * 0.12 }}
          >
            {atom.label}
          </motion.text>
        ))}
      </svg>
      <p className="rounded-xl border border-line bg-black/20 px-4 py-2 font-mono text-sm text-aqua-300">
        {SMILES_EXAMPLE.slice(0, typed)}
        <span className="ml-px inline-block h-4 w-[2px] translate-y-0.5 bg-aqua-300" />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ 3. run the simulation */

const NODES: [number, number][] = [
  [30, 40],
  [90, 110],
  [90, 24],
  [160, 70],
  [160, 140],
  [230, 30],
  [230, 100],
  [290, 60],
  [290, 130],
];
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [3, 6],
  [5, 7],
  [6, 7],
  [6, 8],
  [4, 8],
];
/** The edge that gets throttled by the compound. */
const BLOCKED_EDGE = 3;

export function SimulationIllustration({ active }: IllustrationProps) {
  const reduced = useReduced();
  const flowing = active && !reduced;
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center">
      <svg viewBox="0 0 320 170" className="w-full max-w-md" fill="none">
        {EDGES.map(([from, to], i) => {
          const a = NODES[from]!;
          const b = NODES[to]!;
          const blocked = i === BLOCKED_EDGE;
          return (
            <motion.line
              key={i}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={blocked ? "#ff8f70" : "#5b9dff"}
              strokeWidth={blocked ? 3 : 1.6}
              strokeLinecap="round"
              strokeDasharray={blocked ? "2 7" : "5 6"}
              animate={
                flowing
                  ? { strokeDashoffset: blocked ? [0, -9] : [0, -22] }
                  : { strokeDashoffset: 0 }
              }
              transition={
                flowing
                  ? { duration: blocked ? 2.4 : 1.1, repeat: Infinity, ease: "linear" }
                  : { duration: 0 }
              }
              opacity={active || reduced ? 1 : 0.45}
            />
          );
        })}
        {NODES.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === 3 ? 7 : 5}
            fill={i === 3 ? "#3fd9c8" : "#bcd6ff"}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------ 4. interpret the result */

const BARS = [82, 64, 47, 30, 18];

export function ResultIllustration({ active }: IllustrationProps) {
  const reduced = useReduced();
  const draw = reduced || active;
  return (
    <div aria-hidden="true" className="flex h-full items-center gap-8">
      <svg
        viewBox="0 0 100 100"
        className="hidden size-32 shrink-0 -rotate-90 sm:block"
        fill="none"
      >
        <circle cx="50" cy="50" r="40" stroke="rgb(255 255 255 / 0.1)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          stroke="#3fd9c8"
          strokeWidth="9"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: draw ? 0.62 : 0 }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="flex flex-1 flex-col gap-3.5">
        {BARS.map((width, i) => (
          <div key={i} className="h-3 rounded-full bg-white/[0.06]">
            <motion.div
              className={cn(
                "h-full origin-left rounded-full",
                i < 3 ? "bg-azure-400" : "bg-azure-400/40",
              )}
              style={{ width: `${width}%` }}
              initial={false}
              animate={{ scaleX: draw ? 1 : 0 }}
              transition={{
                duration: reduced ? 0 : 0.9,
                delay: reduced ? 0 : 0.15 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
