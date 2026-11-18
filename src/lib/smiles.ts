import { z } from "zod";

/** Keys of `t.demo.validation`; the form maps them to localized messages. */
export type SmilesErrorKey = "required" | "tooLong" | "invalidChars" | "unbalanced";

export const SMILES_MAX_LENGTH = 300;

/** Parentheses must pair up, and square brackets (atoms such as [C@@H]) must not nest. */
function isBalanced(input: string): boolean {
  let depth = 0;
  let inBracket = false;
  for (const ch of input) {
    if (ch === "[") {
      if (inBracket) return false;
      inBracket = true;
    } else if (ch === "]") {
      if (!inBracket) return false;
      inBracket = false;
    } else if (!inBracket) {
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth < 0) return false;
      }
    }
  }
  return depth === 0 && !inBracket;
}

// Characters allowed in SMILES: atoms, digits, bonds, branches, ring labels, stereo marks, charges.
const SmilesSchema = z
  .string()
  .trim()
  .min(1, "required")
  .max(SMILES_MAX_LENGTH, "tooLong")
  .regex(/^[A-Za-z0-9@+\-[\]()\\/=#$%.:*]+$/, "invalidChars")
  .refine(isBalanced, "unbalanced");

export type SmilesResult = { ok: true; value: string } | { ok: false; error: SmilesErrorKey };

/**
 * Checks the shape of a SMILES string. This is a cheap client-side guard, not a chemistry parser:
 * the backend still has the final word on whether the structure is valid.
 */
export function validateSmiles(input: string): SmilesResult {
  const parsed = SmilesSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  const key = parsed.error.issues[0]?.message as SmilesErrorKey | undefined;
  return { ok: false, error: key ?? "invalidChars" };
}
