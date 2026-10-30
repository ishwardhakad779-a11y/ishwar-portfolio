"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Siren,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import { CountUp, ScrambleText } from "./MicroInteractions";
import {
  LOW_CONFIDENCE,
  SCENARIOS,
  getScenario,
  initialState,
  simReducer,
  type Phase,
  type StepName,
} from "./incidentSim";

const LIVE_URL = "https://incident-response-ai.onrender.com";
const GITHUB_URL = "https://github.com/ishwardhakad779-a11y/-Incident_-AI";

const CYAN = "#22d3ee";

/* =========================================================
   Small pieces
   ========================================================= */

function Typewriter({ text, delay, speed }: { text: string; delay: number; speed: number }) {
  const [count, setCount] = useState(speed === 0 ? text.length : 0);

  useEffect(() => {
    if (speed === 0) {
      setCount(text.length);
      return;
    }
    let frame = 0;
    const begin = performance.now() + delay;
    const tick = (now: number) => {
      const typed = Math.max(0, Math.min(text.length, Math.floor((now - begin) / speed)));
      setCount(typed);
      if (typed < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, delay, speed]);

  const typing = count < text.length;

  return (
    <span>
      {text.slice(0, count)}
      {typing && count > 0 && <span className="sim-caret ml-0.5 inline-block w-[2px] bg-cyan-400 align-middle">&nbsp;</span>}
      {count === 0 && <span className="text-neutral-600">Thinking…</span>}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value * 100));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const color = value >= 0.75 ? "#34d399" : value >= LOW_CONFIDENCE ? CYAN : "#fbbf24";

  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-neutral-500">Confidence</span>
        <span style={{ color }}>
          <CountUp value={Math.round(value * 100)} suffix="%" duration={900} />
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: "width 900ms cubic-bezier(.22, 1, .36, 1)",
          }}
        />
      </div>
    </div>
  );
}

type StepState = "pending" | "running" | "done";

function stepStates(phase: Phase): Record<StepName, StepState> {
  const order: Phase[] = ["idle", "diagnosing", "proposing", "awaiting", "executing", "done"];
  const at = order.indexOf(phase);
  const of = (running: Phase): StepState => {
    const idx = order.indexOf(running);
    if (phase === "done") return "done";
    if (at === idx) return "running";
    return at > idx ? "done" : "pending";
  };
  return {
    diagnose: of("diagnosing"),
    propose_fix: of("proposing"),
    human_approval: of("awaiting"),
    execute: of("executing"),
  };
}

const STEPS: { id: StepName; label: string; Icon: typeof Search; human?: boolean }[] = [
  { id: "diagnose", label: "Diagnose", Icon: Search },
  { id: "propose_fix", label: "Propose fix", Icon: Wrench },
  { id: "human_approval", label: "Approval", Icon: UserCheck, human: true },
  { id: "execute", label: "Execute", Icon: Play },
];

function Stepper({ phase }: { phase: Phase }) {
  const states = stepStates(phase);

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Agent pipeline">
      {STEPS.map(({ id, label, Icon, human }, i) => {
        const st = states[id];
        const ring =
          st === "running"
            ? human
              ? "border-amber-400 bg-amber-400/15 text-amber-300"
              : "border-cyan-400 bg-cyan-400/15 text-cyan-300"
            : st === "done"
            ? "border-cyan-400/50 bg-cyan-400/[0.07] text-cyan-300"
            : human
            ? "border-dashed border-amber-400/30 text-neutral-600"
            : "border-white/[0.12] text-neutral-600";

        return (
          <li key={id} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1/2 top-[18px] h-px w-full -translate-y-1/2 bg-white/[0.1]"
              >
                <span
                  className="block h-full origin-left bg-cyan-400/60"
                  style={{
                    transform: `scaleX(${states[STEPS[i - 1].id] === "done" ? 1 : 0})`,
                    transition: "transform .6s ease-out",
                  }}
                />
              </span>
            )}
            <span
              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-[#0a0a0a] transition-colors duration-300 ${ring}`}
            >
              {st === "running" && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 animate-ping rounded-full border motion-reduce:animate-none ${
                    human ? "border-amber-400/60" : "border-cyan-400/60"
                  }`}
                />
              )}
              {st === "done" ? <CheckCircle2 size={16} /> : <Icon size={15} />}
            </span>
            <span
              className={`mt-2 text-[10px] uppercase tracking-[0.12em] sm:text-[11px] ${
                st === "pending" ? "text-neutral-600" : "text-neutral-300"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_TEXT: Record<Phase, string> = {
  idle: "Ready. Pick an incident and trigger it.",
  diagnosing: "Agent is diagnosing the incident.",
  proposing: "Agent is proposing a fix.",
  awaiting: "Fix proposed. Waiting for your approval.",
  executing: "Executing.",
  done: "Finished.",
};

/* =========================================================
   MAIN
   ========================================================= */

export default function IncidentSimulator() {
  const [state, dispatch] = useReducer(simReducer, undefined, () => initialState());
  const [run, setRun] = useState(0);
  const [reduced, setReduced] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);

  const scenario = getScenario(state.scenarioId);
  const { phase } = state;
  const busy = phase === "diagnosing" || phase === "proposing" || phase === "awaiting" || phase === "executing";

  const THINK = reduced ? 250 : 900;
  const SPEED = reduced ? 0 : 12;
  const PAUSE = reduced ? 250 : 450;
  const EXEC = reduced ? 250 : 1000;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Phase badalte hi agla step timer se chalta hai (approval ko chhodkar: wo user dabata hai)
  useEffect(() => {
    let ms: number | null = null;
    let type: "DIAGNOSED" | "PROPOSED" | "EXECUTED" | null = null;

    if (phase === "diagnosing") {
      ms = THINK + scenario.diagnosis.length * SPEED + PAUSE;
      type = "DIAGNOSED";
    } else if (phase === "proposing") {
      ms = THINK + scenario.fix.length * SPEED + PAUSE;
      type = "PROPOSED";
    } else if (phase === "executing") {
      ms = EXEC;
      type = "EXECUTED";
    }
    if (ms === null || type === null) return;

    const id = setTimeout(() => dispatch({ type, at: Date.now() }), ms);
    return () => clearTimeout(id);
  }, [phase, scenario, THINK, SPEED, PAUSE, EXEC]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [state.log.length, reduced]);

  function start() {
    setRun((r) => r + 1);
    dispatch({ type: "START" });
  }

  function select(id: string) {
    setRun((r) => r + 1);
    dispatch({ type: "SELECT", scenarioId: id });
  }

  const lowConfidence = scenario.confidence < LOW_CONFIDENCE;
  const showDiagnosis = phase !== "idle";
  const showFix = phase !== "idle" && phase !== "diagnosing";
  const showMeter = phase === "awaiting" || phase === "executing" || phase === "done";

  return (
    <section id="incident-sim" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
      <style>{`
        @keyframes sim-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sim-caret { 50% { opacity: 0; } }
        .sim-in { animation: sim-in .4s ease-out both; }
        .sim-caret { animation: sim-caret 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .sim-in, .sim-caret { animation: none; } }
      `}</style>

      <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">Hands-on</p>

      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        <ScrambleText text="Be the on-call engineer." />
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
        This is a simulation of my Incident_AI agent. Pick an incident, watch how the agents diagnose it, and approve or reject the fix yourself, just like the human-in-the-loop gate in the real agent.
      </p>

      <p className="sr-only" aria-live="polite">
        {STATUS_TEXT[phase]}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* LEFT: scenario + pipeline + outputs */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 lg:col-span-3">
          {/* scenario chips */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an incident">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => select(s.id)}
                className={`rounded-full border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  s.id === state.scenarioId
                    ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                    : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* pipeline */}
          <div className="mt-7">
            <Stepper phase={phase} />
          </div>

          {/* incident report */}
          <div className="mt-7 rounded-xl border border-white/[0.08] bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                <Siren size={13} className="text-red-400" /> Incident report
              </p>
              <span className="rounded-full border border-red-400/30 bg-red-400/[0.07] px-2.5 py-0.5 text-[10px] text-red-300">
                {scenario.severity}
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-6 text-neutral-300">{scenario.report}</p>
          </div>

          {/* diagnosis */}
          {showDiagnosis && (
            <div key={`${run}-diag`} className="sim-in mt-4 rounded-xl border border-white/[0.08] bg-black/30 p-4">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                <Search size={13} /> Diagnosis
              </p>
              <p className="mt-2.5 text-sm leading-6 text-neutral-300">
                <Typewriter text={scenario.diagnosis} delay={THINK} speed={SPEED} />
              </p>
            </div>
          )}

          {/* proposed fix */}
          {showFix && (
            <div key={`${run}-fix`} className="sim-in mt-4 rounded-xl border border-white/[0.08] bg-black/30 p-4">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                <Wrench size={13} /> Proposed fix
              </p>
              <p className="mt-2.5 text-sm leading-6 text-white">
                <Typewriter text={scenario.fix} delay={THINK} speed={SPEED} />
              </p>
              {showMeter && (
                <div className="sim-in mt-4">
                  <ConfidenceMeter value={scenario.confidence} />
                  {lowConfidence && (
                    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-300">
                      <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                      Low confidence fix. Human review strongly recommended.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* approval gate */}
          {phase === "awaiting" && (
            <div className="sim-in mt-4 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/[0.05] p-4">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-amber-300">
                <UserCheck size={13} /> Human approval required
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-300">
                The agent will not run anything until you decide.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "DECIDE", approved: true, at: Date.now() })}
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200"
                >
                  <ThumbsUp size={15} /> Approve &amp; execute
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "DECIDE", approved: false, at: Date.now() })}
                  className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-300 transition hover:border-white/30 hover:bg-white/[0.05]"
                >
                  <ThumbsDown size={15} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* execution / result */}
          {phase === "executing" && (
            <div className="sim-in mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 p-4 text-sm text-neutral-400">
              <Loader2 size={15} className="animate-spin text-cyan-400 motion-reduce:animate-none" />
              {state.approved ? "Executing the approved fix…" : "Recording your rejection…"}
            </div>
          )}

          {phase === "done" && state.approved !== null && (
            <div
              className={`sim-in mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${
                state.approved
                  ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200"
                  : "border-white/15 bg-white/[0.03] text-neutral-300"
              }`}
            >
              {state.approved ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle size={17} className="mt-0.5 shrink-0 text-neutral-400" />
              )}
              <span>
                {state.log[state.log.length - 1]?.detail}
                <span className="mt-1 block text-xs text-neutral-500">
                  {state.approved
                    ? "In the real agent, this is where the fix would run."
                    : "Nothing was changed. That is exactly why the approval gate exists."}
                </span>
              </span>
            </div>
          )}

          {/* controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {(phase === "idle" || phase === "done") && (
              <button
                type="button"
                onClick={start}
                data-magnetic
                className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
              >
                {phase === "done" ? <RotateCcw size={15} /> : <Play size={15} />}
                {phase === "done" ? "Run again" : "Trigger incident"}
              </button>
            )}
            {busy && phase !== "awaiting" && (
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" />
                Agents working…
              </span>
            )}
            {phase === "done" && (
              <span className="text-xs text-neutral-600">or pick another incident above</span>
            )}
          </div>
        </div>

        {/* RIGHT: audit trail */}
        <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Audit trail</p>

          <div className="mt-4 min-h-[12rem] flex-1 space-y-3 overflow-y-auto font-mono text-[11px] leading-5 lg:max-h-[30rem]">
            {state.log.length === 0 && (
              <p className="text-neutral-600">
                Every agent step is logged here, just like the real Incident_AI audit trail.
              </p>
            )}
            {state.log.map((entry, i) => (
              <div key={`${run}-${i}`} className="sim-in">
                <p>
                  <span className="text-neutral-600">
                    [{new Date(entry.at).toLocaleTimeString("en-GB")}]
                  </span>{" "}
                  <span className={entry.step === "human_approval" ? "text-amber-300" : "text-cyan-400"}>
                    {entry.step}
                  </span>
                </p>
                <p className="mt-0.5 break-words text-neutral-400">{entry.detail}</p>
              </div>
            ))}
            <div ref={logEnd} />
          </div>

          <div className="mt-5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-neutral-600">
            Simulation with canned incidents. No LLM is called here. The real agent runs on LangGraph
            + Groq:
            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <a
                href={LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-neutral-400 transition hover:text-cyan-400"
              >
                Live demo <ExternalLink size={11} />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-neutral-400 transition hover:text-cyan-400"
              >
                Source <ExternalLink size={11} />
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}