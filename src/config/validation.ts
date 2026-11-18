/**
 * Validation numbers shown in the "Science" section.
 *
 * Fill these in once the DepMap comparison is final. A metric left out is not rendered,
 * so the page never shows a number that was not measured.
 *
 * Example:
 *   export const validationMetrics: ValidationMetrics = {
 *     correlation: "0.62",
 *     cellLines: "3",
 *     compounds: "40",
 *   };
 */
export type ValidationMetricId = "correlation" | "cellLines" | "compounds";
export type ValidationMetrics = Partial<Record<ValidationMetricId, string>>;

export const validationMetrics: ValidationMetrics = {};
