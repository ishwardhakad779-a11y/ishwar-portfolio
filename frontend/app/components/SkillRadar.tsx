"use client";

/* =========================
   SKILL RADAR
   JD ki zarurat (bahari ring) vs Ishwar ke paas kya hai (bhara hua shape).
   Matching skill = poora, missing skill = andar ki taraf dhasa hua.
   Ye haan/naa wala chart hai, koi proficiency percentage nahi.
========================= */

type Props = {
  matching: string[];
  missing: string[];
};

const SIZE_W = 320;
const SIZE_H = 270;
const CX = SIZE_W / 2;
const CY = SIZE_H / 2;
const RADIUS = 78;
const LABEL_RADIUS = 96;
const GAP_LEVEL = 0.14; // missing skill kitna andar tak dikhe

function shorten(label: string, max = 16) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export default function SkillRadar({ matching, missing }: Props) {
  // Balanced: zyada se zyada 5 matching + 3 missing
  const axes = [
    ...matching.slice(0, 5).map((label) => ({ label, have: true })),
    ...missing.slice(0, 3).map((label) => ({ label, have: false })),
  ];

  // Radar ke liye kam se kam 3 axes chahiye
  if (axes.length < 3) return null;

  const count = axes.length;

  function angle(index: number) {
    return -Math.PI / 2 + (index / count) * Math.PI * 2;
  }

  function point(index: number, scale: number) {
    return {
      x: CX + Math.cos(angle(index)) * RADIUS * scale,
      y: CY + Math.sin(angle(index)) * RADIUS * scale,
    };
  }

  const ringPath = (scale: number) =>
    axes
      .map((_, i) => {
        const p = point(i, scale);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const candidatePath =
    axes
      .map((axis, i) => {
        const p = point(i, axis.have ? 1 : GAP_LEVEL);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">
        Skill fit
      </p>

      <svg
        viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}
        role="img"
        aria-label="Radar chart: the job's skills and which ones Ishwar has"
        className="w-full"
      >
        <style>{`@keyframes radar-in{from{transform:scale(.15);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* grid rings */}
        {[1 / 3, 2 / 3, 1].map((scale) => (
          <path
            key={scale}
            d={ringPath(scale)}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
        ))}

        {/* axes */}
        {axes.map((_, i) => {
          const end = point(i, 1);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* candidate shape */}
        <path
          d={candidatePath}
          fill="rgba(34,211,238,0.18)"
          stroke="#22d3ee"
          strokeWidth={1.6}
          strokeLinejoin="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: "radar-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both",
          }}
        />

        {/* dots */}
        {axes.map((axis, i) => {
          const p = point(i, axis.have ? 1 : GAP_LEVEL);
          return (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={axis.have ? "#22d3ee" : "#f59e0b"}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                animation: "radar-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both",
              }}
            />
          );
        })}

        {/* labels */}
        {axes.map((axis, i) => {
          const cos = Math.cos(angle(i));
          const sin = Math.sin(angle(i));
          const x = CX + cos * LABEL_RADIUS;
          const y = CY + sin * LABEL_RADIUS;
          const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={10}
              fill={axis.have ? "#a5f3fc" : "#fbbf24"}
            >
              {shorten(axis.label)}
            </text>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          Ishwar has this
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Not in portfolio
        </span>
      </div>
    </div>
  );
}