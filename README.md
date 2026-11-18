# Virtual Cell Screening

One-page site for a virtual drug-screening platform built on a metabolic model of the cell
(Recon3D + COBRApy). It is a landing page with an interactive 3D cell and a live demo that follows
the contract of a real screening API.

- **Languages:** English, Russian, Kazakh (switcher in the nav; `?lang=kk` also works)
- **Stack:** React 18, Vite 6, TypeScript (strict), Tailwind CSS v4, Framer Motion,
  three.js through react-three-fiber and drei, Recharts, Lucide, Zod
- **Theme:** dark. A light theme is not built (see [Decisions](#decisions))

> **Demo mode.** Until a backend is connected, screening results are generated in the browser from
> fixed, made-up numbers. The page labels them "Synthetic demo data". They are not predictions of
> the real model.

## Quick start

Needs Node 18.18 or newer.

```bash
npm install
cp .env.example .env     # optional, the defaults work
npm run dev              # http://localhost:5173
```

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                         |
| `npm run build`     | Type check (`tsc --noEmit`), then production build |
| `npm run preview`   | Serves the production build locally                |
| `npm run typecheck` | Type check only                                    |
| `npm run format`    | Prettier over `src`                                |

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel choose **Add New, Project**, and import it. Vercel detects Vite
   (build `npm run build`, output `dist`). No extra settings are needed.
3. Set the environment variables below (at least `VITE_GITHUB_URL`).

`vercel.json` adds long-term caching for `/assets` and basic security headers.
`og:image` and `og:url` use `VITE_SITE_URL`, or the production domain Vercel provides.

## Environment variables

All are optional. Copy `.env.example` to `.env` for local use; set them in the Vercel dashboard for
production. Anything with the `VITE_` prefix is public: never put a secret in it.

| Variable                | Default                 | Purpose                                                                 |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `VITE_API_MODE`         | `mock`                  | `mock` answers in the browser. `live` calls `POST {base}/api/screen`    |
| `VITE_API_BASE_URL`     | empty (same origin)     | Backend origin, for example `https://api.example.org`                   |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Dev server proxy for `/api` (read by `vite.config.ts` only)             |
| `VITE_SITE_URL`         | Vercel domain           | Canonical URL for `og:image` and `og:url`                               |
| `VITE_GITHUB_URL`       | placeholder             | Footer link. **Set it before you publish**                              |
| `VITE_DOCS_URL`         | `#science`              | Footer "Documentation" link                                             |
| `VITE_CONTACT_EMAIL`    | empty                   | Footer contact (`mailto:`). Without it the link points to GitHub issues |

## Connecting the backend

The demo calls one endpoint. The client is `src/lib/api.ts`; the response is checked with Zod
(`src/lib/schema.ts`) before it reaches the UI, so a malformed answer shows a "bad response" message
instead of breaking the chart.

```
POST /api/screen
Content-Type: application/json
```

Request:

```json
{ "cellLine": "MDA-MB-231", "smiles": "CN(C)C(=N)N=C(N)N", "compoundId": "metformin" }
```

`cellLine` is `MDA-MB-231`, `HepG2` or `HeLa`. `compoundId` is set only when a preset was picked.
`smiles` is at most 300 characters.

Response `200`:

```json
{
  "requestId": "6f0c1c52-6d1e-4c1a-8d57-3a1b2f0f9b10",
  "cellLine": "MDA-MB-231",
  "compound": { "smiles": "CN(C)C(=N)N=C(N)N", "compoundId": "metformin" },
  "growthInhibitionPct": 31,
  "confidence": 0.82,
  "topPathways": [{ "id": "oxphos", "name": "Oxidative phosphorylation", "deltaFlux": -58 }],
  "profile": [{ "id": "oxphos", "name": "Oxidative phosphorylation", "deltaFlux": -58 }],
  "model": { "name": "Recon3D", "version": "1.0" },
  "runtimeMs": 2410,
  "synthetic": false
}
```

- `growthInhibitionPct` is 0 to 100, `confidence` is 0 to 1.
- `deltaFlux` is the change in flux through a pathway, in percent (negative means it dropped).
- `topPathways` are the three strongest changes; `profile` is the wider list drawn in the chart.
- Pathway `id`s the page knows (`folate`, `pyrimidine`, `purine`, `nucleotide`, `cholesterol`,
  `oxphos`, `tca`, `glycolysis`, `glutamine`, `fao`, `ppp`, `sphingolipid`) are shown translated.
  An unknown `id` falls back to `name`.
- Set `synthetic` to `false` for real model output. The "Synthetic demo data" badge disappears.
- On failure return a non-2xx status. The page shows its own translated sentence for the status and
  never prints the server's message.

A FastAPI sketch of the same contract (not run, shown for the shape):

```python
from typing import Literal
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()
CellLine = Literal["MDA-MB-231", "HepG2", "HeLa"]

class ScreenRequest(BaseModel):
    cellLine: CellLine
    smiles: str = Field(min_length=1, max_length=300, pattern=r"^[A-Za-z0-9@+\-\[\]()\\/=#$%.:*]+$")
    compoundId: str | None = None

class PathwayEffect(BaseModel):
    id: str
    name: str
    deltaFlux: float

class ScreenResponse(BaseModel):
    requestId: str
    cellLine: CellLine
    compound: dict
    growthInhibitionPct: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    topPathways: list[PathwayEffect]
    profile: list[PathwayEffect]
    model: dict
    runtimeMs: int
    synthetic: bool = False

@app.post("/api/screen", response_model=ScreenResponse)
async def screen(body: ScreenRequest) -> ScreenResponse: ...
```

To switch the page over: `VITE_API_MODE=live`. In development leave `VITE_API_BASE_URL` empty and
the dev server proxies `/api` to `VITE_API_PROXY_TARGET`. If the backend lives on another origin in
production, allow the site's origin in the backend's CORS settings.

**Test hook for the error state:** in mock mode, enter the SMILES text `error` (custom SMILES tab)
and the run fails with a server error, so the error panel can be shown on demand.

## Project structure

```
src/
  main.tsx, App.tsx          entry point and page shell (layers, skip link, section order)
  index.css                  Tailwind v4 theme tokens, glass and skeleton utilities, base styles
  config/
    site.ts                  footer links, section ids
    validation.ts            validation numbers shown in "Science" (empty by default)
  i18n/
    dictionary.ts            the Dictionary interface: every string on the page
    en.ts  ru.ts  kk.ts      the three languages, each must satisfy Dictionary
    I18nProvider.tsx         useI18n(): { locale, setLocale, t }
    locales.ts, format.ts    language detection, number formatting, {placeholder} interpolation
  lib/
    api.ts                   screen(): mock or live POST /api/screen
    mockScreening.ts         deterministic browser-side stand-in (synthetic numbers)
    schema.ts, types.ts      response validation (Zod) and shared types
    smiles.ts, compounds.ts  SMILES shape check, the five presets
  hooks/                     useScreening (state machine), useMedia, useActiveSection, ...
  components/
    background/              WebGL mesh-gradient shader + CSS fallback
    cell/                    procedural 3D cell (organelles, scene, fallback, error boundary)
    sections/                Hero, Problem, VirtualCell, HowItWorks, Demo, Science
    demo/                    ScreeningForm, LoadingState, ResultCard, ResultChart
    layout/                  Nav, Footer
    ui/                      Button, GlassCard, Reveal, Counter, SplitWords, Section, ...
public/                      favicon.svg, og.png (1200x630)
```

## How it is built

- **Background.** One full-screen WebGL fragment shader: five soft blobs, domain warping, a palette
  that moves from indigo through blue to teal as you scroll, then a 50% navy overlay and a vignette
  for text contrast. It renders at a fraction of the screen size, runs at 30 fps on phones, pauses in
  a hidden tab, and falls back to a CSS gradient if WebGL is missing or the context is lost.
- **3D cell.** Built from three.js primitives at runtime, no model files. The membrane is a fresnel
  shader, the others are separate meshes with emissive materials: nucleus, four mitochondria, rough
  ER, Golgi, instanced ribosomes. Click or tap an organelle, or use the chip buttons (keyboard and
  screen readers), to zoom the camera and open its panel. three.js loads in its own chunk after the
  text has painted, and stops rendering while off screen.
- **Motion.** Scroll reveals come in several directions, the hero has a cursor spotlight and
  parallax, "How it works" is a pinned horizontal timeline. With `prefers-reduced-motion` the
  background is a still frame, reveals and counters are plain, the timeline is a normal column and
  the 3D scene does not auto-rotate.
- **Accessibility.** Skip link, labelled controls, scroll-spy `aria-current`, `aria-live` panels, a
  progress bar with `role="progressbar"`, 44 px touch targets, visible focus ring, and a hidden data
  table next to the chart.
- **Performance.** Fonts are self-hosted. three.js, Recharts and Framer Motion are split into their
  own chunks, and Recharts loads only when a result appears.

### Adding a language

1. Copy `src/i18n/en.ts` to `src/i18n/xx.ts` and translate the values. The `Dictionary` type makes a
   missing key a compile error.
2. Register it in `src/i18n/locales.ts`: add the code to `LOCALES`, the dictionary to
   `dictionaries`, and the switcher label to `LOCALE_LABELS`.

Russian and Kazakh headings use Inter, because Space Grotesk has no Cyrillic (see `index.css`).

## Before you publish

- [ ] Set `VITE_GITHUB_URL` (and `VITE_DOCS_URL`, `VITE_CONTACT_EMAIL`). Until then the footer points
      to a placeholder repository.
- [ ] Fill `src/config/validation.ts` with the real DepMap comparison. A metric left out is not
      shown, so the "Science" section never displays a number that was not measured.
- [ ] Have a Kazakh and a Russian speaker read the translations, and a domain expert read the
      science copy in `src/i18n/en.ts` (the `cell`, `how` and `science` blocks: Recon3D, flux balance
      analysis, the limits).
- [ ] The "12 years" figure in the Problem section is a commonly cited range (10 to 15 years) with no
      link, because the primary source could not be opened while writing. Confirm it or replace it.
- [ ] Run `npm run build`, then Lighthouse on `npm run preview` (targets: Performance 90+,
      Accessibility 95+), and check 360 px, 768 px and 1440 px widths for horizontal scroll.
- [ ] Test with the OS setting "reduce motion" on, and with WebGL disabled.

## Decisions

- **No light theme.** The brief marks it optional. The animated background and the glass surfaces
  are tuned for dark, and a half-finished light theme would hurt contrast more than no theme.
- **Text wordmarks instead of logos.** The "sources" list names COBRApy, Recon3D, CELLxGENE, ChEMBL
  and DepMap in plain type with links, so the page does not imply endorsement by those projects.
- **Honest numbers.** Every number in the demo is labelled synthetic, and the "What it does not do"
  block states that the model covers metabolism only.
- **Lucide is pinned to `0.469.x`** so the icon names used here stay valid.
- **react-three-fiber 8 and drei 9**, because version 9 of fiber needs React 19.

## Sources

- Sun, D. et al. (2022). Why 90% of clinical drug development fails. _Acta Pharm Sin B_.
- DiMasi, J. A., Grabowski, H. G., Hansen, R. W. (2016). Innovation in the pharmaceutical industry:
  new estimates of R&D costs. _J Health Econ_.
- Brunk, E. et al. (2018). Recon3D enables a three-dimensional view of gene variation in human
  metabolism. _Nat Biotechnol_ 36, 272-281. doi:10.1038/nbt.4072
- Tools and data: [COBRApy](https://opencobra.github.io/cobrapy/),
  [CELLxGENE](https://cellxgene.cziscience.com/), [ChEMBL](https://www.ebi.ac.uk/chembl/),
  [DepMap](https://depmap.org/portal/)
