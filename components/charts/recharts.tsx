"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Camada Recharts tematizada do DS (decisão nº 11 do ADR 13): eixos,
 * grid e tooltip estilizados UMA vez sobre os tokens; séries usam a
 * paleta categórica validada (--cat-1..8, ordem fixa). Todo gráfico
 * novo compõe estes wrappers — nunca Recharts cru na página.
 * (As micro-visualizações StatRing/CategoricalBar continuam SVG leve
 * por decisão de acabamento; isto aqui serve os dashboards analíticos.)
 */

export const CAT = Array.from({ length: 8 }, (_, i) => `var(--cat-${i + 1})`);

const AXIS = {
  stroke: "var(--fg-subtle)",
  fontSize: 12,
  tickLine: false as const,
  axisLine: false as const,
};

interface DsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { dataKey?: string | number; name?: string; value?: number | string; color?: string }[];
}

function DsTooltip({ active, payload, label }: DsTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-card-2 px-3 py-2 text-sm shadow-elevated">
      {label !== undefined && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ background: entry.color }}
            aria-hidden
          />
          {entry.name}: <span className="tabular-nums text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DsBarChart({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip content={<DsTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={CAT[i % CAT.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DsLineChart({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip content={<DsTooltip />} cursor={{ stroke: "var(--border-hover)" }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={CAT[i % CAT.length]}
            strokeWidth={2}
            dot={false}
            type="monotone"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
