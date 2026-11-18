import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsNarrow, useReduced } from "@/hooks/useMedia";
import { useI18n } from "@/i18n/I18nProvider";
import type { PathwayEffect } from "@/lib/types";
import { deltaColor, formatDelta, pathwayLabel } from "./resultFormat";

/*
 * Horizontal diverging bars: how much the flux through each pathway changed, in percent.
 * Bars grow left (decrease) or right (increase) from a zero line; each carries its value.
 * This file is loaded lazily, so Recharts stays out of the first page load.
 */

interface ChartRow {
  id: string;
  label: string;
  deltaFlux: number;
}

const TEXT = "#eaeefa";
const TEXT_MUTED = "#bcc5de";
const GRID = "rgb(255 255 255 / 0.08)";
const ZERO_LINE = "rgb(255 255 255 / 0.4)";
const BAR_HEIGHT = 16;
const ROW_HEIGHT = 46;

/** Greedy word wrap for the axis labels (recharts ticks are SVG and do not wrap by themselves). */
function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface PathwayTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  maxChars?: number;
}

function PathwayTick({ x = 0, y = 0, payload, maxChars = 24 }: PathwayTickProps) {
  const lines = wrapLabel(payload?.value ?? "", maxChars);
  return (
    <text
      x={x - 8}
      y={y}
      textAnchor="end"
      fill={TEXT_MUTED}
      fontSize={12}
      dominantBaseline="central"
    >
      {lines.map((line, index) => (
        <tspan key={line} x={x - 8} dy={index === 0 ? `${-0.6 * (lines.length - 1)}em` : "1.2em"}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

interface DeltaBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartRow;
}

/**
 * One bar, drawn by hand so the data end is rounded and the base stays square on the zero line,
 * and so the value label sits next to the end of the bar. Works whichever way recharts signs `width`.
 */
function DeltaBar({ x = 0, y = 0, width = 0, height = 0, payload }: DeltaBarProps) {
  const { locale } = useI18n();
  if (!payload) return null;

  const left = Math.min(x, x + width);
  const w = Math.abs(width);
  if (w < 0.5 || height <= 0) return null;

  const decrease = payload.deltaFlux < 0;
  const r = Math.min(4, w, height / 2);
  const top = y;
  const bottom = y + height;
  const right = left + w;

  // The rounded end is the data end: left for a decrease, right for an increase.
  const d = decrease
    ? `M${right},${top} H${left + r} Q${left},${top} ${left},${top + r} V${bottom - r} Q${left},${bottom} ${left + r},${bottom} H${right} Z`
    : `M${left},${top} H${right - r} Q${right},${top} ${right},${top + r} V${bottom - r} Q${right},${bottom} ${right - r},${bottom} H${left} Z`;

  return (
    <g>
      <path d={d} fill={deltaColor(payload.deltaFlux)} />
      <text
        x={decrease ? left - 8 : right + 8}
        y={y + height / 2}
        textAnchor={decrease ? "end" : "start"}
        dominantBaseline="central"
        fill={TEXT}
        fontSize={12}
        fontWeight={600}
      >
        {formatDelta(locale, payload.deltaFlux)}
      </text>
    </g>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const { t, locale } = useI18n();
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-ink-800/95 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="font-medium text-fg">{row.label}</p>
      <p className="mt-1 flex items-center gap-2 text-fg-muted">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-[3px]"
          style={{ background: deltaColor(row.deltaFlux) }}
        />
        {row.deltaFlux < 0 ? t.demo.result.decreased : t.demo.result.increased}:{" "}
        <span className="font-semibold text-fg tabular-nums">
          {formatDelta(locale, row.deltaFlux)}
        </span>
      </p>
    </div>
  );
}

export default function ResultChart({ profile }: { profile: PathwayEffect[] }) {
  const { t, locale } = useI18n();
  const narrow = useIsNarrow();
  const reduced = useReduced();

  const rows = useMemo<ChartRow[]>(
    () =>
      profile.map((item) => ({
        id: item.id,
        label: pathwayLabel(t, item),
        deltaFlux: item.deltaFlux,
      })),
    [profile, t],
  );

  const height = rows.length * ROW_HEIGHT + 34;

  return (
    <figure className="m-0">
      {/* The drawing is decorative for screen readers: the table below carries the same numbers. */}
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
            barSize={BAR_HEIGHT}
          >
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis
              type="number"
              domain={[
                (min: number) => Math.floor(Math.min(min, 0) * 1.35),
                (max: number) => Math.ceil(Math.max(max, 0) * 1.35),
              ]}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: TEXT_MUTED, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={narrow ? 120 : 184}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<PathwayTick maxChars={narrow ? 17 : 27} />}
            />
            <ReferenceLine x={0} stroke={ZERO_LINE} />
            <Tooltip
              cursor={{ fill: "rgb(255 255 255 / 0.05)" }}
              content={<ChartTooltip />}
              isAnimationActive={false}
            />
            <Bar
              dataKey="deltaFlux"
              shape={<DeltaBar />}
              isAnimationActive={!reduced}
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-1 text-center text-xs text-fg-muted">
        {t.demo.result.chartAxis}
      </figcaption>

      <table className="sr-only">
        <caption>{t.demo.result.chart}</caption>
        <thead>
          <tr>
            <th scope="col">{t.demo.result.topPathways}</th>
            <th scope="col">{t.demo.result.chartAxis}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              <td>{formatDelta(locale, row.deltaFlux)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
