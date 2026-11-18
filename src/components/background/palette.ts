type Rgb = [number, number, number];

/** Ground colour under the blobs: #0A0E1A. */
export const BASE_COLOR: Rgb = [10 / 255, 14 / 255, 26 / 255];

/**
 * Blob colours (sRGB, 0 to 1). Three stages, five blobs each:
 * the top of the page is indigo and violet, the middle blue, the bottom teal.
 */
const STAGES: Rgb[][] = [
  [
    [0.13, 0.3, 0.85],
    [0.38, 0.25, 0.85],
    [0.05, 0.35, 0.7],
    [0.2, 0.2, 0.65],
    [0.45, 0.18, 0.6],
  ],
  [
    [0.1, 0.45, 0.95],
    [0.18, 0.35, 0.85],
    [0.05, 0.55, 0.8],
    [0.12, 0.3, 0.75],
    [0.25, 0.35, 0.9],
  ],
  [
    [0.05, 0.75, 0.7],
    [0.08, 0.55, 0.8],
    [0.02, 0.65, 0.62],
    [0.1, 0.45, 0.7],
    [0.04, 0.6, 0.75],
  ],
];

/** Flattened for gl.uniform3fv: 3 stages x 5 blobs x 3 channels = 45 floats. */
export const PALETTE = new Float32Array(STAGES.flat(2));
