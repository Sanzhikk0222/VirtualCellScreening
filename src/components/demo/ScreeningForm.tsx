import { ChevronDown, Loader2, Play, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { COMPOUND_PRESETS, getPreset } from "@/lib/compounds";
import { validateSmiles, type SmilesErrorKey } from "@/lib/smiles";
import { CELL_LINES, type CellLineId, type CompoundId, type ScreeningRequest } from "@/lib/types";

interface ScreeningFormProps {
  /** A screening is running: the fields lock and the button shows progress. */
  busy: boolean;
  onSubmit: (request: ScreeningRequest) => void;
  onCancel: () => void;
}

type Mode = "preset" | "custom";

const FIELD =
  "w-full rounded-2xl border border-line-strong bg-ink-950/60 px-4 text-fg placeholder:text-fg-subtle " +
  "transition-colors duration-200 hover:border-white/30 focus-visible:border-aqua-400 disabled:opacity-60";

/** Cell line, compound (preset or custom SMILES) and the run button. Validates before it submits. */
export function ScreeningForm({ busy, onSubmit, onCancel }: ScreeningFormProps) {
  const { t } = useI18n();
  const f = t.demo.form;
  const uid = useId();

  const [cellLine, setCellLine] = useState<CellLineId>("MDA-MB-231");
  const [mode, setMode] = useState<Mode>("preset");
  const [compoundId, setCompoundId] = useState<CompoundId>("methotrexate");
  const [smiles, setSmiles] = useState("");
  const [error, setError] = useState<SmilesErrorKey | null>(null);
  const smilesRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    if (mode === "preset") {
      onSubmit({ cellLine, smiles: getPreset(compoundId).smiles, compoundId });
      return;
    }

    const checked = validateSmiles(smiles);
    if (!checked.ok) {
      setError(checked.error);
      smilesRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit({ cellLine, smiles: checked.value });
  };

  // Enter submits the custom structure; Shift+Enter is not needed, SMILES has no line breaks.
  const handleSmilesKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const smilesHelpId = `${uid}-smiles-help`;
  const smilesErrorId = `${uid}-smiles-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <fieldset disabled={busy} className="contents">
        {/* Cell line */}
        <div>
          <label htmlFor={`${uid}-cell`} className="mb-2 block text-sm font-medium">
            {f.cellLine}
          </label>
          <div className="relative">
            <select
              id={`${uid}-cell`}
              value={cellLine}
              onChange={(event) => setCellLine(event.target.value as CellLineId)}
              className={cn(FIELD, "min-h-12 appearance-none pr-11 [color-scheme:dark]")}
            >
              {CELL_LINES.map((id) => (
                <option key={id} value={id}>
                  {id} · {t.demo.cellLines[id]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-muted"
            />
          </div>
        </div>

        {/* Compound */}
        <div>
          <p id={`${uid}-compound`} className="mb-2 text-sm font-medium">
            {f.compound}
          </p>

          <div
            role="radiogroup"
            aria-labelledby={`${uid}-compound`}
            className="grid grid-cols-2 gap-1 rounded-full border border-line bg-black/20 p-1"
          >
            {(["preset", "custom"] as const).map((value) => (
              <label key={value} className="relative">
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  value={value}
                  checked={mode === value}
                  onChange={() => {
                    setMode(value);
                    setError(null);
                  }}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex min-h-10 items-center justify-center rounded-full px-3 text-sm transition-colors duration-200",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-aqua-400",
                    mode === value
                      ? "bg-white/12 font-medium text-fg"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {value === "preset" ? f.presets : f.custom}
                </span>
              </label>
            ))}
          </div>

          {mode === "preset" ? (
            <div role="radiogroup" aria-label={f.presets} className="mt-4 flex flex-col gap-2">
              {COMPOUND_PRESETS.map((preset) => {
                const copy = t.demo.compounds[preset.id];
                const checked = compoundId === preset.id;
                return (
                  <label
                    key={preset.id}
                    className={cn(
                      "relative block rounded-2xl border px-4 py-3 transition-colors duration-200",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-aqua-400",
                      busy ? "cursor-not-allowed" : "cursor-pointer",
                      checked
                        ? "border-aqua-400/60 bg-aqua-400/10"
                        : "border-line bg-white/[0.03] hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${uid}-compound-radio`}
                      value={preset.id}
                      checked={checked}
                      onChange={() => setCompoundId(preset.id)}
                      aria-describedby={checked ? `${uid}-mechanism` : undefined}
                      className="sr-only"
                    />
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{copy.name}</span>
                      <span className="font-mono text-xs text-fg-muted">
                        {preset.targets.join(" · ")}
                      </span>
                    </span>
                    <AnimatePresence initial={false}>
                      {checked ? (
                        <motion.span
                          id={`${uid}-mechanism`}
                          key="mechanism"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="block overflow-hidden text-sm text-fg-muted"
                        >
                          <span className="block pt-1.5">{copy.mechanism}</span>
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor={`${uid}-smiles`} className="mb-2 block text-sm text-fg-muted">
                {f.smiles}
              </label>
              <textarea
                id={`${uid}-smiles`}
                ref={smilesRef}
                value={smiles}
                rows={4}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                placeholder={f.smilesPlaceholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? smilesErrorId : smilesHelpId}
                onChange={(event) => {
                  setSmiles(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleSmilesKey}
                className={cn(
                  FIELD,
                  "resize-none py-3 font-mono text-sm leading-relaxed break-all",
                  error && "border-coral-400",
                )}
              />
              {error ? (
                <p id={smilesErrorId} role="alert" className="mt-2 text-sm text-coral-400">
                  {t.demo.validation[error]}
                </p>
              ) : (
                <p id={smilesHelpId} className="mt-2 text-sm text-fg-muted">
                  {f.smilesHelp}
                </p>
              )}
            </div>
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        {/* aria-disabled instead of disabled: keyboard focus stays on the button while it runs. */}
        <Button
          type="submit"
          size="lg"
          aria-disabled={busy}
          aria-busy={busy}
          icon={busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          className="aria-disabled:cursor-progress aria-disabled:opacity-80"
        >
          {busy ? f.running : f.run}
        </Button>
        {busy ? (
          <Button variant="ghost" onClick={onCancel} icon={<X className="size-4" />}>
            {f.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
