import { hash } from "./random";

/*
 * A structure key for SMILES strings, used to recognise the same molecule written in a different way.
 *
 * One molecule has many valid SMILES: the atoms can be listed from any starting point, rings can be
 * written in Kekule form (C1=CC=CC=C1) or aromatic form (c1ccccc1), stereo marks can be present or
 * not. Comparing the strings therefore says nothing about the molecule.
 *
 * The key here is built from the heavy-atom graph only: elements and which atoms are bonded.
 * Bond orders, aromatic flags, charges, stereo marks and hydrogens are left out, because those are
 * exactly the parts that differ between spellings of one molecule. The graph is hashed with a few
 * rounds of Weisfeiler-Lehman refinement, which does not depend on the order the atoms were written.
 *
 * This is deliberately a rough check for the demo, enough to tell the five preset drugs from each
 * other and from random input. A real backend should canonicalise with a chemistry toolkit (RDKit).
 */

interface Graph {
  elements: string[];
  neighbors: number[][];
}

const ORGANIC_SUBSET = new Set(["B", "C", "N", "O", "P", "S", "F", "I"]);
const AROMATIC_SUBSET = new Set(["b", "c", "n", "o", "p", "s"]);
const BOND_CHARS = new Set(["-", "=", "#", "$", ":", "/", "\\"]);

/** Reads one atom inside square brackets, e.g. "nH", "C@@H", "13C", "Na+". Returns its element. */
function bracketElement(inner: string): string | null {
  const body = inner.replace(/^\d+/, ""); // isotope
  const match = /^(?:[A-Z][a-z]?|[a-z]{1,2}|\*)/.exec(body);
  if (!match) return null;
  const symbol = match[0];
  return symbol.charAt(0).toUpperCase() + symbol.slice(1);
}

/** Parses a SMILES string into a heavy-atom graph. Returns null for anything it does not understand. */
function parse(smiles: string): Graph | null {
  const elements: string[] = [];
  const neighbors: number[][] = [];
  const open = new Map<string, number>();
  const stack: (number | null)[] = [];
  let prev: number | null = null;

  const link = (a: number, b: number) => {
    if (a === b || neighbors[a]!.includes(b)) return;
    neighbors[a]!.push(b);
    neighbors[b]!.push(a);
  };
  const addAtom = (element: string) => {
    const index = elements.length;
    elements.push(element);
    neighbors.push([]);
    if (prev !== null) link(prev, index);
    prev = index;
  };

  let i = 0;
  while (i < smiles.length) {
    const ch = smiles.charAt(i);

    if (ch === "[") {
      const end = smiles.indexOf("]", i);
      if (end < 0) return null;
      const element = bracketElement(smiles.slice(i + 1, end));
      if (!element) return null;
      // Explicit hydrogens are not heavy atoms: they do not enter the graph.
      if (element !== "H") addAtom(element);
      i = end + 1;
    } else if (ch === "(") {
      stack.push(prev);
      i += 1;
    } else if (ch === ")") {
      if (stack.length === 0) return null;
      prev = stack.pop() ?? null;
      i += 1;
    } else if (ch === ".") {
      prev = null;
      i += 1;
    } else if (BOND_CHARS.has(ch)) {
      i += 1;
    } else if (/\d/.test(ch) || ch === "%") {
      let label = ch;
      if (ch === "%") {
        label = smiles.slice(i + 1, i + 3);
        if (!/^\d\d$/.test(label)) return null;
        i += 3;
      } else {
        i += 1;
      }
      if (prev === null) return null;
      const partner = open.get(label);
      if (partner === undefined) {
        open.set(label, prev);
      } else {
        link(prev, partner);
        open.delete(label);
      }
    } else if (smiles.startsWith("Cl", i) || smiles.startsWith("Br", i)) {
      addAtom(smiles.slice(i, i + 2));
      i += 2;
    } else if (ORGANIC_SUBSET.has(ch) || ch === "*") {
      addAtom(ch);
      i += 1;
    } else if (AROMATIC_SUBSET.has(ch)) {
      addAtom(ch.toUpperCase());
      i += 1;
    } else {
      return null;
    }
  }

  if (stack.length > 0 || open.size > 0 || elements.length === 0) return null;
  return { elements, neighbors };
}

/** The connected piece with the most atoms, so a salt or a solvent next to the drug is ignored. */
function largestComponent(graph: Graph): number[] {
  const seen = new Set<number>();
  let best: number[] = [];
  for (let start = 0; start < graph.elements.length; start += 1) {
    if (seen.has(start)) continue;
    const members = [start];
    seen.add(start);
    for (let k = 0; k < members.length; k += 1) {
      for (const next of graph.neighbors[members[k]!]!) {
        if (!seen.has(next)) {
          seen.add(next);
          members.push(next);
        }
      }
    }
    if (members.length > best.length) best = members;
  }
  return best;
}

/**
 * Key of the largest molecule in a SMILES string, or null if the string cannot be read.
 * Two spellings of one molecule give the same key.
 */
export function structureKey(smiles: string): string | null {
  const graph = parse(smiles.trim());
  if (!graph) return null;

  const atoms = largestComponent(graph);
  const index = new Map(atoms.map((atom, position) => [atom, position]));
  const elements = atoms.map((atom) => graph.elements[atom]!);
  const neighbors = atoms.map((atom) => graph.neighbors[atom]!.map((n) => index.get(n)!));
  const bondCount = neighbors.reduce((sum, list) => sum + list.length, 0) / 2;

  // Weisfeiler-Lehman refinement: a label stands for the atom and everything around it.
  let labels = elements.map((element) => String(hash(element)));
  for (let round = 0; round < Math.min(8, atoms.length); round += 1) {
    labels = labels.map((label, atom) => {
      const around = neighbors[atom]!.map((n) => labels[n]!)
        .sort()
        .join(",");
      return String(hash(`${label}|${around}`));
    });
  }

  const counts = new Map<string, number>();
  for (const element of elements) counts.set(element, (counts.get(element) ?? 0) + 1);
  const formula = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([element, count]) => `${element}${count}`)
    .join("");

  return `${formula}|${bondCount}|${hash([...labels].sort().join(","))}`;
}
