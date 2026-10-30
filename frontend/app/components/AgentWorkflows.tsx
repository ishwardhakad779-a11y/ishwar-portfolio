"use client";

import { ScrambleText } from "./MicroInteractions";

import { useEffect, useState } from "react";

/* =========================
   REAL FLOWS (repos ke LangGraph code se)
   Naya project add karna ho toh bas ek object yahan add kar do.
========================= */

type FlowNode = {
  label: string;
  tag: string;
  caption: string;
  side?: { label: string; note: string }[];
};

type Flow = {
  id: string;
  title: string;
  summary: string;
  nodes: FlowNode[];
};

const flows: Flow[] = [
  {
    id: "incident",
    title: "Incident Response AI",
    summary: "An SRE agent that diagnoses incidents and proposes fixes.",
    nodes: [
      {
        label: "Incident report",
        tag: "Input",
        caption: "The incident or alert description enters the system.",
      },
      {
        label: "Diagnose",
        tag: "LLM",
        caption: "The SRE agent reads the incident and finds the root cause.",
      },
      {
        label: "Propose fix",
        tag: "LLM",
        caption: "Suggests a specific fix along with a confidence score.",
      },
      {
        label: "Human approval",
        tag: "Human-in-the-loop",
        caption:
          "A human approves or rejects the fix. Nothing runs without approval.",
      },
      {
        label: "Execute",
        tag: "Action",
        caption:
          "The approved fix runs, and every step is saved to the audit trail.",
      },
    ],
  },
  {
    id: "research",
    title: "AI Research Assistant",
    summary: "A multi-agent system that builds answers from both documents and the web.",
    nodes: [
      {
        label: "Question",
        tag: "Input",
        caption: "The user asks a research question.",
      },
      {
        label: "Document agent",
        tag: "RAG · ChromaDB",
        caption: "Retrieves the relevant parts of the uploaded documents.",
      },
      {
        label: "Web agent",
        tag: "Tavily search",
        caption: "Brings in fresh information from web search.",
      },
      {
        label: "Answer agent",
        tag: "LLM",
        caption:
          "Combines documents and web results into a final answer.",
      },
    ],
  },
  {
    id: "yojana",
    title: "YojanaSaathi",
    summary: "An agent that helps people find Indian government schemes, in simple Hinglish (Hindi + English).",
    nodes: [
      {
        label: "User message",
        tag: "Input",
        caption: "The user describes their question or situation in Hinglish.",
      },
      {
        label: "Extract profile",
        tag: "LLM → JSON",
        caption:
          "Extracts details like age, occupation, income, state and gender from the message.",
      },
      {
        label: "Router",
        tag: "Conditional edge",
        caption:
          "Decides: just a greeting, missing details, or go straight to finding schemes.",
        side: [
          { label: "Greet", note: "Replies directly to a hello" },
          { label: "Ask", note: "Asks for the missing details" },
        ],
      },
      {
        label: "Retrieve",
        tag: "ChromaDB",
        caption: "Turns the question into a search query and fetches the most relevant schemes.",
      },
      {
        label: "Answer",
        tag: "LLM",
        caption:
          "Answers in simple Hinglish and tells which schemes were used.",
      },
    ],
  },
];

const STEP_MS = 1800;

/* =========================
   COMPONENT
========================= */

export default function AgentWorkflows() {
  const [flowIndex, setFlowIndex] = useState(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const flow = flows[flowIndex];

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % flow.nodes.length);
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [flow, paused]);

  function selectFlow(index: number) {
    setFlowIndex(index);
    setActive(0);
  }

  const node = flow.nodes[active];

  return (
    <section
      id="workflows"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
        Under the hood
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        <ScrambleText text="How my agents work." />
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
        These flows are taken from the real code of my LangGraph projects. Click any step to see what it does.
      </p>

      {/* project tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {flows.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectFlow(index)}
            className={`rounded-full border px-4 py-2 text-xs transition ${
              index === flowIndex
                ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                : "border-white/10 text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-neutral-500">{flow.summary}</p>

      {/* flow */}
      <div
        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex flex-col items-stretch md:flex-row md:items-start">
          {flow.nodes.map((item, index) => {
            const isActive = index === active;
            const isDone = index < active;

            return (
              <div
                key={`${flow.id}-${item.label}`}
                className="flex flex-col items-center md:flex-1 md:flex-row md:items-start"
              >
                <div className="flex w-full flex-col items-center md:w-auto md:min-w-[7.5rem] md:max-w-[9rem]">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-pressed={isActive}
                    className={`w-full rounded-xl border px-3 py-3 text-center transition-all duration-500 ${
                      isActive
                        ? "scale-105 border-cyan-400/70 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                        : isDone
                        ? "border-cyan-400/25 bg-white/[0.03]"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium transition-colors duration-500 ${
                        isActive || isDone ? "text-white" : "text-neutral-400"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
                      {item.tag}
                    </p>
                  </button>

                  {item.side && (
                    <div className="mt-2 w-full space-y-1.5">
                      {item.side.map((s) => (
                        <div
                          key={s.label}
                          className="rounded-lg border border-dashed border-white/10 px-2 py-1.5 text-center"
                        >
                          <p className="text-[11px] text-neutral-400">
                            {s.label}
                          </p>
                          <p className="text-[10px] leading-4 text-neutral-600">
                            {s.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {index < flow.nodes.length - 1 && (
                  <div className="relative my-1 h-8 w-px shrink-0 bg-white/10 md:mx-1 md:mt-[1.6rem] md:h-px md:w-auto md:flex-1">
                    <div
                      className={`absolute inset-0 bg-cyan-400 transition-opacity duration-700 ${
                        index < active ? "opacity-80" : "opacity-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* caption */}
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-widest text-cyan-400">
            Step {active + 1} of {flow.nodes.length} · {node.label}
          </p>
          <p
            key={`${flow.id}-${active}`}
            className="mt-2 min-h-[3rem] text-sm leading-6 text-neutral-300"
          >
            {node.caption}
          </p>
        </div>
      </div>
    </section>
  );
}