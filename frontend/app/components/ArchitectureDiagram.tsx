"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/* =========================
   HOW THIS SITE WORKS
   Animated architecture. Teen flows, teeno is site ke asli raaste hain:
   - Page load : browser -> Vercel (page), browser -> FastAPI -> Neon (data)
   - Ask AI    : browser -> FastAPI -> Neon (facts) -> Groq (jawab)
   - Admin save: browser -> Next.js proxy (secret key yahin lagti hai) -> FastAPI -> Neon
========================= */

type NodeId = "browser" | "next" | "api" | "neon" | "groq";

const NODES: Record<
  NodeId,
  { x: number; y: number; w: number; h: number; title: string; sub: string }
> = {
  browser: { x: 20, y: 130, w: 130, h: 60, title: "Browser", sub: "Visitor" },
  next: { x: 250, y: 20, w: 160, h: 60, title: "Next.js", sub: "Vercel · UI + proxy" },
  api: { x: 250, y: 230, w: 160, h: 60, title: "FastAPI", sub: "Render · API" },
  neon: { x: 540, y: 110, w: 140, h: 60, title: "Neon", sub: "Postgres" },
  groq: { x: 540, y: 230, w: 140, h: 60, title: "Groq", sub: "LLM" },
};

type EdgeId = "bn" | "ba" | "na" | "an" | "ag";

const EDGES: Record<
  EdgeId,
  { from: [number, number]; to: [number, number]; ends: [NodeId, NodeId] }
> = {
  bn: { from: [150, 150], to: [250, 55], ends: ["browser", "next"] },
  ba: { from: [150, 175], to: [250, 255], ends: ["browser", "api"] },
  na: { from: [330, 80], to: [330, 230], ends: ["next", "api"] },
  an: { from: [410, 245], to: [540, 150], ends: ["api", "neon"] },
  ag: { from: [410, 260], to: [540, 260], ends: ["api", "groq"] },
};

type Step = { edge: EdgeId; reverse?: boolean; text: string };

const FLOWS: Record<string, { label: string; steps: Step[] }> = {
  load: {
    label: "Page load",
    steps: [
      { edge: "bn", text: "Browser Vercel se page maangta hai." },
      { edge: "bn", reverse: true, text: "Next.js HTML aur JavaScript wapas bhejta hai." },
      { edge: "ba", text: "Page ka JS seedha FastAPI se profile aur projects maangta hai." },
      { edge: "an", text: "FastAPI Neon database se data padhta hai." },
      { edge: "an", reverse: true, text: "Neon data wapas deta hai." },
      { edge: "ba", reverse: true, text: "FastAPI JSON browser ko bhejta hai, aur page bhar jata hai." },
    ],
  },
  ask: {
    label: "Ask AI",
    steps: [
      { edge: "ba", text: "Tera sawal seedha FastAPI ko jata hai." },
      { edge: "an", text: "FastAPI Neon se portfolio ke facts nikalta hai." },
      { edge: "an", reverse: true, text: "Projects aur profile ka data wapas aata hai." },
      { edge: "ag", text: "Facts aur sawal Groq LLM ko bheje jaate hain." },
      { edge: "ag", reverse: true, text: "LLM sirf un facts ke basis pe jawab likhta hai." },
      { edge: "ba", reverse: true, text: "Jawab browser me aa jata hai." },
    ],
  },
  admin: {
    label: "Admin save",
    steps: [
      { edge: "bn", text: "Save dabate hi request Next.js ke proxy ko jaati hai." },
      { edge: "na", text: "Proxy server pe secret key lagata hai. Browser ko key kabhi dikhti nahi." },
      { edge: "an", text: "FastAPI key check karke data Neon me save karta hai." },
      { edge: "an", reverse: true, text: "Neon save hone ki confirmation deta hai." },
      { edge: "na", reverse: true, text: "FastAPI proxy ko jawab deta hai." },
      { edge: "bn", reverse: true, text: "Browser me 'Saved' dikh jata hai." },
    ],
  },
};

const STEP_MS = 1300;

export default function ArchitectureDiagram() {
  const sectionRef = useRef<HTMLElement>(null);
  const [flow, setFlow] = useState<keyof typeof FLOWS>("ask");
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);

  const steps = FLOWS[flow].steps;
  // tick == steps.length matlab flow poora ho gaya (ek chhota pause), phir dobara
  const active = Math.min(tick, steps.length - 1);
  const finished = tick >= steps.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !playing) return;

    const id = setInterval(() => {
      setTick((t) => (t >= steps.length ? 0 : t + 1));
    }, STEP_MS);

    return () => clearInterval(id);
  }, [visible, playing, steps.length]);

  function chooseFlow(next: keyof typeof FLOWS) {
    setFlow(next);
    setTick(0);
  }

  const litEdges = new Set<EdgeId>(
    steps.slice(0, active + 1).map((s) => s.edge)
  );

  const current = steps[active];
  const currentEdge = EDGES[current.edge];
  const activeNodes = new Set<NodeId>(currentEdge.ends);

  const [fx, fy] = current.reverse ? currentEdge.to : currentEdge.from;
  const [tx, ty] = current.reverse ? currentEdge.from : currentEdge.to;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
        Under the hood
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        How this site works.
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
        Ye portfolio khud ek chhota production system hai. Neeche koi flow chuno
        aur dekho ki ek request kis raaste se guzarti hai.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {Object.entries(FLOWS).map(([id, item]) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseFlow(id)}
            className={`rounded-full border px-4 py-2 text-xs transition ${
              flow === id
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause animation" : "Play animation"}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-neutral-300 transition hover:border-white/25"
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
          {playing ? "Pause" : "Play"}
        </button>

        {!playing && (
          <button
            type="button"
            onClick={() => setTick((t) => (t >= steps.length ? 0 : t + 1))}
            className="rounded-full border border-white/10 px-3.5 py-2 text-xs text-neutral-300 transition hover:border-white/25"
          >
            Next step
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
        <svg
          viewBox="0 0 700 320"
          role="img"
          aria-label="Architecture diagram: Browser, Next.js on Vercel, FastAPI on Render, Neon Postgres and Groq LLM"
          className="min-w-[600px] w-full"
        >
          {/* edges */}
          {(Object.keys(EDGES) as EdgeId[]).map((id) => {
            const e = EDGES[id];
            const lit = litEdges.has(id);
            const isActive = id === current.edge && !finished;

            return (
              <line
                key={id}
                x1={e.from[0]}
                y1={e.from[1]}
                x2={e.to[0]}
                y2={e.to[1]}
                stroke={
                  isActive
                    ? "#22d3ee"
                    : lit
                    ? "rgba(34,211,238,0.35)"
                    : "rgba(255,255,255,0.1)"
                }
                strokeWidth={isActive ? 2.2 : 1.4}
                strokeDasharray={lit ? undefined : "4 5"}
              />
            );
          })}

          {/* nodes */}
          {(Object.keys(NODES) as NodeId[]).map((id) => {
            const n = NODES[id];
            const on = activeNodes.has(id) && !finished;

            return (
              <g key={id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={12}
                  fill={on ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)"}
                  stroke={on ? "#22d3ee" : "rgba(255,255,255,0.15)"}
                  strokeWidth={on ? 1.8 : 1}
                />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 26}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fill="#ffffff"
                >
                  {n.title}
                </text>
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 45}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#a3a3a3"
                >
                  {n.sub}
                </text>
              </g>
            );
          })}

          {/* request dot */}
          {!finished && (
            <g key={`${flow}-${tick}`}>
              <circle r={11} fill="rgba(34,211,238,0.22)" />
              <circle r={5} fill="#67e8f9" />
              <animateMotion
                dur="1s"
                fill="freeze"
                path={`M${fx},${fy} L${tx},${ty}`}
              />
            </g>
          )}
        </svg>

        <div className="mt-4 rounded-xl bg-black/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-cyan-400">
            Step {active + 1} / {steps.length}
            {finished ? " · done" : ""}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-neutral-200">
            {current.text}
          </p>
        </div>
      </div>
    </section>
  );
}
