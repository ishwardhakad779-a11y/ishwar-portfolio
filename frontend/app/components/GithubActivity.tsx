"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, GitBranch, Star } from "lucide-react";

/* Live GitHub proof for recruiters.
   Uses the public GitHub API from the browser (no token needed).
   If GitHub rate-limits or fails, the whole section hides itself. */

type Repo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
};

type Summary = {
  publicRepos: number;
  stars: number;
  activeLast30: number;
  lastPush: string | null;
  languages: { name: string; count: number }[];
  recent: Repo[];
};

const CACHE_KEY = "gh-activity-v1";
const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function GithubActivity({ username }: { username: string }) {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          setData(JSON.parse(cached) as Summary);
          return;
        }
      } catch {
        /* storage can be blocked, ignore */
      }

      try {
        const [userRes, repoRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`),
          fetch(
            `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`
          ),
        ]);

        if (!userRes.ok || !repoRes.ok) throw new Error("github");

        const user = await userRes.json();
        const repos: Repo[] = await repoRes.json();
        const own = repos.filter((r) => !r.fork);

        const counts = new Map<string, number>();
        own.forEach((r) => {
          if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1);
        });

        const monthAgo = Date.now() - 30 * 86400000;

        const summary: Summary = {
          publicRepos: user.public_repos ?? own.length,
          stars: own.reduce((sum, r) => sum + r.stargazers_count, 0),
          activeLast30: own.filter(
            (r) => new Date(r.pushed_at).getTime() > monthAgo
          ).length,
          lastPush: own[0]?.pushed_at ?? null,
          languages: Array.from(counts, ([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          recent: own.slice(0, 4),
        };

        if (cancelled) return;
        setData(summary);

        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(summary));
        } catch {
          /* ignore */
        }
      } catch {
        /* leave data null, section stays hidden */
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!data) return null;

  const totalLang = data.languages.reduce((s, l) => s + l.count, 0) || 1;

  const stats = [
    { label: "Public repos", value: String(data.publicRepos) },
    { label: "Active this month", value: String(data.activeLast30) },
    {
      label: "Last push",
      value: data.lastPush ? timeAgo(data.lastPush) : "n/a",
    },
  ];

  return (
    <section
      id="github"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
          Proof of work
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Live from GitHub
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
          These numbers were just fetched from GitHub. They are not hard-coded.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="bg-gradient-to-br from-cyan-300 to-violet-300 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {data.languages.length > 0 && (
              <div className="mt-7">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Languages (by repo)
                </p>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                  {data.languages.map((l, i) => (
                    <div
                      key={l.name}
                      style={{
                        width: `${(l.count / totalLang) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {data.languages.map((l, i) => (
                    <span
                      key={l.name}
                      className="flex items-center gap-1.5 text-xs text-neutral-400"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 transition hover:border-cyan-300/50 hover:text-white"
            >
              Open GitHub profile <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.recent.map((repo) => (
              <a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <GitBranch size={14} className="shrink-0 text-cyan-300" />
                    <span className="truncate">{repo.name}</span>
                  </p>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-neutral-600 transition group-hover:text-cyan-300"
                  />
                </div>

                <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-neutral-500">
                  {repo.description || "No description yet."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                  {repo.language && <span>{repo.language}</span>}
                  <span className="flex items-center gap-1">
                    <Star size={11} /> {repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {timeAgo(repo.pushed_at)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}