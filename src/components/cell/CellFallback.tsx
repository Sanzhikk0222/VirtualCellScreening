/**
 * Static drawing of the cell. It holds the space while the 3D scene downloads (no layout shift)
 * and replaces the scene when WebGL is unavailable.
 */
export function CellFallback() {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className="size-full">
      <defs>
        <radialGradient id="cell-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3b7cf0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3fd9c8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="150" fill="url(#cell-glow)" />
      <circle cx="200" cy="200" r="150" stroke="#3fd9c8" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="188" cy="190" r="52" fill="#4f8cff" fillOpacity="0.55" />
      <circle cx="198" cy="184" r="16" fill="#dbe8ff" fillOpacity="0.9" />
      <ellipse
        cx="270"
        cy="150"
        rx="30"
        ry="14"
        transform="rotate(-35 270 150)"
        fill="#ff8f70"
        fillOpacity="0.75"
      />
      <ellipse
        cx="125"
        cy="262"
        rx="28"
        ry="13"
        transform="rotate(30 125 262)"
        fill="#ff8f70"
        fillOpacity="0.75"
      />
      <path
        d="M250 255c14 4 28 0 38-10M248 268c16 5 32 0 44-11M246 281c18 5 36 0 50-12"
        stroke="#ffcf5c"
        strokeOpacity="0.8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="150" cy="160" r="3" fill="#dfe8ff" />
      <circle cx="240" cy="230" r="3" fill="#dfe8ff" />
      <circle cx="170" cy="250" r="3" fill="#dfe8ff" />
      <circle cx="262" cy="196" r="3" fill="#dfe8ff" />
    </svg>
  );
}
