"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* =========================
   LIVE DEMO STATUS BOARD
   Backend asli demo URLs ko ping karta hai. Section screen pe aate hi
   check shuru hota hai (page khulte hi nahi), taaki free hosting ke
   soye hue demos tab jaagen jab recruiter inhe dekh raha ho.
========================= */

type DemoStatus = "online" | "waking" | "offline" | "paused";

type Demo = {
  title: string;
  url: string;
  status: DemoStatus;
  ms: number | null;
  checked_at: number;
};

const MAX_POLLS = 14; // ~ 2 minute tak jaagne ka intezaar
const POLL_GAP_MS = 8000;

function label(demo: Demo) {
  switch (demo.status) {
    case "online":
      return demo.ms !== null ? `Awake · ${demo.ms} ms` : "Awake";
    case "waking":
      return "Waking up… (free hosting, 30-50s lagte hain)";
    case "paused":
      return "Check paused (free hosting hours bachane ke liye)";
    default:
      return "Not responding";
  }
}

function dotClass(status: DemoStatus) {
  switch (status) {
    case "online":
      return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]";
    case "waking":
      return "animate-pulse bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]";
    case "paused":
      return "bg-neutral-500";
    default:
      return "bg-red-400";
  }
}

export default function DemoStatus() {
  const sectionRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);
  const pollsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);

  const poll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Backend khud so raha ho toh pehli request lambi ho sakti hai
    const hardTimeout = setTimeout(() => controller.abort(), 75000);

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/demo-status`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Status check nahi ho paya.");

      const data = (await res.json()) as { demos: Demo[] };
      setDemos(data.demos);
      setEmpty(data.demos.length === 0);

      pollsRef.current += 1;

      const stillWaking = data.demos.some((d) => d.status === "waking");

      if (stillWaking && pollsRef.current < MAX_POLLS) {
        timerRef.current = setTimeout(poll, POLL_GAP_MS);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Status abhi load nahi ho paya. Thodi der baad refresh karo.");
    } finally {
      clearTimeout(hardTimeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          poll();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [poll]);

  function refresh() {
    if (timerRef.current) clearTimeout(timerRef.current);
    pollsRef.current = 0;
    poll();
  }

  const onlineCount = demos.filter((d) => d.status === "online").length;

  return (
    <section
      ref={sectionRef}
      id="demo-status"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
            Live status
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {demos.length > 0
              ? `${onlineCount} of ${demos.length} demos abhi online hain.`
              : "Demos abhi online hain ya nahi?"}
          </h2>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
        Ye board asli hai: mera server har demo ko sach me ping karta hai.
        Free hosting par demos kuch der baad so jaate hain, aur ye check unhe
        jaga bhi deta hai. Isliye &quot;Open demo&quot; dabane se pehle wait
        kam lagta hai.
      </p>

      {loading && demos.length === 0 && (
        <p className="mt-8 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 size={14} className="animate-spin" />
          Demos ko ping kar raha hu... (server so raha ho toh 30-50 second)
        </p>
      )}

      {error && (
        <p className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {empty && !error && (
        <p className="mt-8 text-sm text-neutral-500">
          Abhi kisi project me live demo link nahi laga hai.
        </p>
      )}

      {demos.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {demos.map((demo) => (
            <div
              key={demo.url}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${dotClass(
                  demo.status
                )}`}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {demo.title}
                </p>
                <p className="mt-1 text-xs text-neutral-400">{label(demo)}</p>
              </div>

              <a
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-neutral-300 transition hover:border-cyan-400/40 hover:text-white"
              >
                Open demo
                <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
