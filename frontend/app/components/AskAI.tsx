"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type Msg = { role: "user" | "assistant"; content: string };

type JDResult = {
  match_percent: number;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  relevant_projects: { title: string; reason: string }[];
  pitch: string;
};

const SUGGESTIONS = [
  "Ishwar kya build karta hai?",
  "Which project should I look at first?",
  "Is Ishwar open to internships?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! Main Ishwar ka AI assistant hoon. Mujhse uske projects, skills ya availability ke baare mein kuch bhi pooch sakte ho.",
};

/* =========================
   API HELPER
========================= */

async function postJSON<T>(
  path: string,
  body: unknown,
  onSlow?: () => void
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75000);
  // Render free server soya ho toh pehli request slow hoti hai
  const slow = setTimeout(() => onSlow?.(), 7000);

  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = "";

      try {
        const data = await res.json();
        if (typeof data.detail === "string") detail = data.detail;
      } catch {
        /* ignore */
      }

      throw new Error(detail || "Kuch gadbad ho gayi, dobara try karo.");
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Server ne jawab dene mein bahut time liya. Dobara try karo."
      );
    }

    if (error instanceof TypeError) {
      throw new Error("Server se connect nahi ho paya. Dobara try karo.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    clearTimeout(slow);
  }
}

/* =========================
   COMPONENT
========================= */

export default function AskAI() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ask" | "jd">("ask");

  /* chat */
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSlow, setChatSlow] = useState(false);
  const [chatError, setChatError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  /* jd match */
  const [jd, setJd] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const [jdSlow, setJdSlow] = useState(false);
  const [jdError, setJdError] = useState("");
  const [result, setResult] = useState<JDResult | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading, open, tab]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || chatLoading) return;

    const history = messages.filter((m) => m !== WELCOME).slice(-6);

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setChatError("");
    setChatSlow(false);
    setChatLoading(true);

    try {
      const data = await postJSON<{ reply: string }>(
        "/chat",
        { message, history },
        () => setChatSlow(true)
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Kuch gadbad ho gayi."
      );
    } finally {
      setChatLoading(false);
      setChatSlow(false);
    }
  }

  function onChatSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  async function onJdSubmit(event: FormEvent) {
    event.preventDefault();
    if (jdLoading) return;

    if (jd.trim().length < 40) {
      setJdError("Poora job description paste karo (kam se kam 40 characters).");
      return;
    }

    setJdError("");
    setResult(null);
    setJdSlow(false);
    setJdLoading(true);

    try {
      const data = await postJSON<JDResult>(
        "/jd-match",
        { job_description: jd },
        () => setJdSlow(true)
      );

      setResult(data);
    } catch (error) {
      setJdError(
        error instanceof Error ? error.message : "Kuch gadbad ho gayi."
      );
    } finally {
      setJdLoading(false);
      setJdSlow(false);
    }
  }

  const scoreColor =
    !result
      ? ""
      : result.match_percent >= 70
      ? "bg-emerald-400"
      : result.match_percent >= 45
      ? "bg-cyan-400"
      : "bg-amber-400";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Ask AI"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#0a0a0a]/95 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/10 backdrop-blur transition hover:border-cyan-400/60 hover:bg-[#101010]"
        >
          <Sparkles size={16} className="text-cyan-400" />
          Ask AI
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Ask Ishwar's AI"
          className="fixed inset-x-3 bottom-3 z-40 flex h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" />
              <p className="text-sm font-semibold">Ask Ishwar&apos;s AI</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* tabs */}
          <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-1.5 text-xs">
            {(
              [
                ["ask", "Ask"],
                ["jd", "JD Match"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg py-2 transition ${
                  tab === id
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ASK TAB */}
          {tab === "ask" && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                        m.role === "user"
                          ? "bg-cyan-500/15 text-cyan-50"
                          : "bg-white/[0.05] text-neutral-200"
                      }`}
                    >
                      {m.content}
                    </p>
                  </div>
                ))}

                {messages.length === 1 && !chatLoading && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-cyan-400/40 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 size={13} className="animate-spin" />
                    {chatSlow
                      ? "Server jaag raha hai, 30-50 second lag sakte hain..."
                      : "Soch raha hoon..."}
                  </div>
                )}

                {chatError && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {chatError}
                  </p>
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={onChatSubmit}
                className="flex gap-2 border-t border-white/10 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Kuch bhi poocho..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-400/50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input.trim()}
                  aria-label="Send"
                  className="rounded-xl bg-cyan-500 px-3.5 text-black transition hover:bg-cyan-400 disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}

          {/* JD TAB */}
          {tab === "jd" && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={onJdSubmit} className="space-y-3">
                <p className="text-xs leading-5 text-neutral-500">
                  Job description paste karo, AI batayega Ishwar is role ke
                  liye kitna fit hai.
                </p>

                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  maxLength={6000}
                  rows={7}
                  placeholder="Paste job description here..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-400/50"
                />

                <button
                  type="submit"
                  disabled={jdLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  {jdLoading && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {jdLoading ? "Analysing..." : "Check match"}
                </button>
              </form>

              {jdSlow && (
                <p className="mt-3 text-xs text-neutral-500">
                  Server jaag raha hai, 30-50 second lag sakte hain...
                </p>
              )}

              {jdError && (
                <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {jdError}
                </p>
              )}

              {result && (
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-semibold">
                        {result.match_percent}%
                      </p>
                      <p className="text-xs text-neutral-500">match</p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${scoreColor}`}
                        style={{ width: `${result.match_percent}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-neutral-300">
                      {result.summary}
                    </p>
                  </div>

                  {result.matching_skills.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">
                        Matching skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matching_skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missing_skills.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">
                        Not in portfolio
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing_skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-neutral-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.relevant_projects.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">
                        Relevant projects
                      </p>
                      <ul className="space-y-2">
                        {result.relevant_projects.map((p) => (
                          <li
                            key={p.title}
                            className="rounded-xl border border-white/10 px-3 py-2.5"
                          >
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-neutral-400">
                              {p.reason}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.pitch && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">
                        Pitch
                      </p>
                      <p className="rounded-xl bg-white/[0.04] px-3.5 py-3 text-sm leading-6 text-neutral-300">
                        {result.pitch}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}