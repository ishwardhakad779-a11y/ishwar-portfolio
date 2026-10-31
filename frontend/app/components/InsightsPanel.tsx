"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type Insights = {
  days: number;
  totals: Record<string, number>;
  daily: { date: string; visits: number }[];
  top_projects: { name: string; live: number; source: number }[];
  questions: { kind: string; text: string; at: string }[];
};

const STATS: { key: string; label: string }[] = [
  { key: "visit", label: "Visits" },
  { key: "ask_ai", label: "Ask AI questions" },
  { key: "jd_match", label: "JD checks" },
  { key: "agent_run", label: "Live agent runs" },
  { key: "resume_click", label: "Resume clicks" },
  { key: "email_click", label: "Email clicks" },
  { key: "linkedin_click", label: "LinkedIn clicks" },
  { key: "github_click", label: "GitHub clicks" },
];

export default function InsightsPanel({ adminApi }: { adminApi: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${adminApi}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.detail || "Insights load nahi hue.");

      setData(json as Insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Insights load nahi hue.");
    } finally {
      setLoading(false);
    }
  }, [adminApi, days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxVisits = Math.max(1, ...(data?.daily.map((d) => d.visits) ?? [1]));

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Visitor insights
        </p>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-[#0b0b0b] px-3 py-2 text-xs outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-300 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.key}
                className="rounded-xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-2xl font-semibold text-white">
                  {data.totals[s.key] ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs text-neutral-500">Visits per day</p>
            <div className="mt-3 flex h-24 items-end gap-[3px]">
              {data.daily.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.visits}`}
                  className="flex-1 rounded-t bg-cyan-400/60"
                  style={{
                    height: `${Math.max(3, (d.visits / maxVisits) * 100)}%`,
                    opacity: d.visits === 0 ? 0.2 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500">Most opened projects</p>

              {data.top_projects.length === 0 ? (
                <p className="mt-3 text-xs text-neutral-600">
                  Abhi koi click nahi aaya.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.top_projects.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-xs"
                    >
                      <span className="min-w-0 truncate text-neutral-200">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-neutral-500">
                        {p.live} live · {p.source} source
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-neutral-500">
                Recent questions (Ask AI and live agent)
              </p>

              {data.questions.length === 0 ? (
                <p className="mt-3 text-xs text-neutral-600">
                  Abhi kisi ne sawal nahi puchha.
                </p>
              ) : (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {data.questions.map((q, i) => (
                    <div
                      key={`${q.at}-${i}`}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                    >
                      <p className="text-xs leading-5 text-neutral-200">
                        {q.text || "(empty)"}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-600">
                        {q.kind === "agent_run" ? "Live agent" : "Ask AI"} ·{" "}
                        {new Date(q.at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-neutral-600">
            Anonymous counts: koi IP ya cookie store nahi hoti. Apne aap ko
            ginti se bahar rakhne ke liye har device/browser par site ek baar
            <span className="text-neutral-400"> ?notrack </span>
            ke saath kholo (jaise ishwar-portfolio-17.vercel.app/?notrack).
          </p>
        </>
      )}
    </section>
  );
}
