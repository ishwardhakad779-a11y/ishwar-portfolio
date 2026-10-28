"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* =========================
   TYPES
========================= */

type StepStatus = "idle" | "running" | "done" | "error";

type StepState = {
  status: StepStatus;
  detail: string;
  ms?: number;
};

type AgentEvent = {
  type?: "final" | "error";
  step?: number;
  status?: "running" | "done";
  detail?: string;
  ms?: number;
  t?: number;
  answer?: string;
  total_ms?: number;
};

type TraceLine = {
  t: number;
  text: string;
  kind: "info" | "error";
};

const STEPS = [
  { label: "Question", tag: "Input" },
  { label: "Retrieve", tag: "Keyword search · DB" },
  { label: "Draft", tag: "LLM · Groq" },
  { label: "Verify", tag: "Link grounding check" },
];

const SUGGESTIONS = [
  "Which project uses LangGraph and RAG?",
  "Ishwar ka incident response project kya karta hai?",
  "Is Ishwar open to internships?",
];

const emptySteps = (): StepState[] =>
  STEPS.map(() => ({ status: "idle", detail: "" }));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function seconds(ms: number) {
  return `+${(ms / 1000).toFixed(2)}s`;
}

/* =========================
   COMPONENT
========================= */

export default function LiveAgent() {
  const [question, setQuestion] = useState("");
  const [steps, setSteps] = useState<StepState[]>(emptySteps());
  const [trace, setTrace] = useState<TraceLine[]>([]);
  const [answer, setAnswer] = useState("");
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function addTrace(line: TraceLine) {
    setTrace((prev) => [...prev, line]);
  }

  function handleEvent(ev: AgentEvent) {
    if (ev.type === "final") {
      setAnswer(ev.answer ?? "");
      setTotalMs(ev.total_ms ?? null);
      return;
    }

    if (ev.type === "error") {
      const message = ev.detail || "Kuch gadbad ho gayi, dobara try karo.";
      setError(message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "error" } : s
        )
      );
      addTrace({ t: ev.t ?? 0, text: `Error: ${message}`, kind: "error" });
      return;
    }

    if (typeof ev.step === "number" && ev.status) {
      const index = ev.step;
      const status = ev.status;

      setSteps((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                status,
                detail: ev.detail ?? s.detail,
                ms: ev.ms ?? s.ms,
              }
            : s
        )
      );

      const label = STEPS[index]?.label ?? `Step ${index + 1}`;
      const text =
        status === "running"
          ? `${label} chal raha hai...`
          : `${label}${ev.ms !== undefined ? ` (${ev.ms}ms)` : ""}: ${
              ev.detail ?? "done"
            }`;

      addTrace({ t: ev.t ?? 0, text, kind: "info" });
    }
  }

  async function run(text: string) {
    const q = text.trim();
    if (q.length < 3 || running) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuestion(q);
    setSteps(emptySteps());
    setTrace([]);
    setAnswer("");
    setTotalMs(null);
    setError("");
    setSlow(false);
    setRunning(true);

    // Render free server soya ho toh pehli request slow hoti hai
    const slowTimer = setTimeout(() => setSlow(true), 7000);
    const hardTimeout = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(`${API}/agent-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let detail = "";

        try {
          const data = await res.json();
          if (typeof data.detail === "string") detail = data.detail;
        } catch {
          /* ignore */
        }

        throw new Error(detail || "Kuch gadbad ho gayi, dobara try karo.");
      }

      setSlow(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");

        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));

          if (line) {
            try {
              const ev = JSON.parse(line.slice(6)) as AgentEvent;
              handleEvent(ev);

              // Shuru ke instant steps ko thoda dikhne do, warna ek jhatke me nikal jayenge
              if (
                ev.status === "done" &&
                typeof ev.step === "number" &&
                ev.step <= 1
              ) {
                await sleep(280);
              }
            } catch {
              /* kharab chunk ignore */
            }
          }

          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Server ne jawab dene mein bahut time liya. Dobara try karo.");
      } else if (err instanceof TypeError) {
        setError("Server se connect nahi ho paya. Dobara try karo.");
      } else {
        setError(
          err instanceof Error ? err.message : "Kuch gadbad ho gayi."
        );
      }
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(hardTimeout);
      setSlow(false);
      setRunning(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run(question);
  }

  const started = steps.some((s) => s.status !== "idle");

  return (
    <section
      id="live-agent"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
        Live demo
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Watch an agent think.
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
        Ye animation nahi, asli agent hai. Sawal poochho: ye database me se
        relevant projects dhoondta hai, Groq LLM se jawab likhta hai, aur phir
        check karta hai ki jawab ke links portfolio me sach me hain ya nahi.
        Har step backend se live stream hota hai.
      </p>

      {/* input */}
      <form onSubmit={onSubmit} className="mt-8 flex max-w-2xl gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          disabled={running}
          placeholder="Ishwar ke baare me kuch poochho..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-400/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={running || question.trim().length < 3}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:opacity-40"
        >
          {running ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          Run agent
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={running}
            onClick={() => run(s)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {slow && (
        <p className="mt-4 text-xs text-neutral-500">
          Server jaag raha hai, 30-50 second lag sakte hain...
        </p>
      )}

      {/* graph */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-8">
        <div className="flex flex-col items-stretch md:flex-row md:items-start">
          {STEPS.map((item, index) => {
            const state = steps[index];
            const isRunning = state.status === "running";
            const isDone = state.status === "done";
            const isError = state.status === "error";

            return (
              <div
                key={item.label}
                className="flex flex-col items-center md:flex-1 md:flex-row md:items-start"
              >
                <div className="flex w-full flex-col items-center md:w-auto md:min-w-[8rem] md:max-w-[10rem]">
                  <div
                    className={`w-full rounded-xl border px-3 py-3 text-center transition-all duration-500 ${
                      isRunning
                        ? "scale-105 border-cyan-400/70 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.3)]"
                        : isDone
                        ? "border-cyan-400/30 bg-cyan-400/[0.04]"
                        : isError
                        ? "border-red-400/50 bg-red-400/10"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <p
                      className={`flex items-center justify-center gap-1.5 text-sm font-medium transition-colors duration-500 ${
                        isRunning || isDone
                          ? "text-white"
                          : isError
                          ? "text-red-300"
                          : "text-neutral-500"
                      }`}
                    >
                      {isRunning && (
                        <Loader2
                          size={12}
                          className="animate-spin text-cyan-300"
                        />
                      )}
                      {item.label}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
                      {item.tag}
                    </p>
                    {state.ms !== undefined && (
                      <p className="mt-1 text-[10px] text-cyan-400/80">
                        {state.ms}ms
                      </p>
                    )}
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div className="relative my-1 h-8 w-px shrink-0 bg-white/10 md:mx-1 md:mt-[1.6rem] md:h-px md:w-auto md:flex-1">
                    <div
                      className={`absolute inset-0 bg-cyan-400 transition-opacity duration-700 ${
                        steps[index].status === "done"
                          ? "opacity-80"
                          : "opacity-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* trace */}
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-widest text-cyan-400">
            Live trace
          </p>

          <div className="mt-3 min-h-[5.5rem] space-y-1.5 rounded-xl bg-black/40 p-4 font-mono text-xs leading-5">
            {!started && (
              <p className="text-neutral-600">
                Agent abhi idle hai. Upar se sawal poochho ya koi suggestion
                dabao.
              </p>
            )}

            {trace.map((line, i) => (
              <p
                key={i}
                className={
                  line.kind === "error" ? "text-red-300" : "text-neutral-300"
                }
              >
                <span className="mr-2 text-cyan-500/80">{seconds(line.t)}</span>
                {line.text}
              </p>
            ))}
          </div>
        </div>

        {/* answer */}
        {error && (
          <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </p>
        )}

        {answer && (
          <div className="mt-5">
            <p className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-neutral-500">
              <span>Final answer</span>
              {totalMs !== null && (
                <span className="normal-case tracking-normal text-neutral-600">
                  total {(totalMs / 1000).toFixed(1)}s
                </span>
              )}
            </p>
            <p className="whitespace-pre-wrap rounded-xl bg-white/[0.04] px-4 py-3.5 text-sm leading-7 text-neutral-200">
              {answer}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
