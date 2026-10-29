"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

/* =========================
   TERMINAL EASTER EGG
   Backtick ( ` ) dabao ya kone ka chhota `>_` button. Commands: help, about,
   projects, open <n>, skills, hire-me, contact, resume, clear, exit
   (aur kuch chhupe hue: sudo, coffee...)
   Saara data page se aata hai, yani admin panel se badlo toh yahan bhi badal jata hai.
========================= */

const GITHUB_URL = "https://github.com/ishwardhakad779-a11y";
const LINKEDIN_URL = "https://www.linkedin.com/in/ishwar-dhakad-213b503b0";
const EMAIL = "ishwardhakad779@gmail.com";

type TProject = {
  title: string;
  category?: string;
  live_url?: string | null;
  github_url?: string | null;
};

type Props = {
  name?: string;
  headline?: string;
  bio?: string;
  availability?: string;
  projects: TProject[];
  stack: string[];
  resumeUrl?: string;
};

type Line = { id: number; kind: "cmd" | "out" | "err"; text: string };

const WELCOME = [
  "Welcome to ishwar@portfolio 👋",
  "Type 'help' to see what you can do.",
];

export default function HeroTerminal({
  name,
  headline,
  bio,
  availability,
  projects,
  stack,
  resumeUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  function makeLines(kind: Line["kind"], texts: string[]): Line[] {
    return texts.map((text) => ({ id: idRef.current++, kind, text }));
  }

  // Backtick se kholo, Esc se band
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "`" && !typing) {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;

    setLines((prev) =>
      prev.length === 0 ? makeLines("out", WELCOME) : prev
    );

    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  function hireMeLines(): string[] {
    return [
      "Ishwar is available. Here is how to reach him:",
      availability?.trim() ? `Status : ${availability.trim()}` : "",
      `Email  : ${EMAIL}`,
      `GitHub : ${GITHUB_URL}`,
      `LinkedIn: ${LINKEDIN_URL}`,
    ].filter(Boolean);
  }

  function execute(raw: string): { out: string[]; err?: boolean } {
    const [first, ...args] = raw.trim().split(/\s+/);
    const cmd = (first || "").toLowerCase();

    switch (cmd) {
      case "":
        return { out: [] };

      case "help":
        return {
          out: [
            "Available commands:",
            "  about      ye banda kaun hai",
            "  projects   saare projects",
            "  open <n>   n number ka project kholo (jaise: open 1)",
            "  skills     tech stack",
            "  hire-me    availability aur contact",
            "  contact    email, GitHub, LinkedIn",
            "  resume     resume kholo",
            "  clear      screen saaf",
            "  exit       terminal band",
          ],
        };

      case "about":
      case "whoami":
        return {
          out: [
            name?.trim() || "Ishwar Dhakad",
            headline?.trim() || "",
            "",
            bio?.trim() || "",
          ].filter((l, i, arr) => l !== "" || (i > 0 && arr[i - 1] !== "")),
        };

      case "projects":
      case "ls":
        if (projects.length === 0) {
          return { out: ["Abhi koi project nahi mila."] };
        }
        return {
          out: [
            ...projects.map(
              (p, i) =>
                `  ${i + 1}. ${p.title}${p.category ? `  [${p.category}]` : ""}`
            ),
            "",
            "Type 'open <number>' to open one.",
          ],
        };

      case "open": {
        const n = Number(args[0]);

        if (!Number.isInteger(n) || n < 1 || n > projects.length) {
          return {
            out: [`Usage: open <1-${Math.max(projects.length, 1)}>`],
            err: true,
          };
        }

        const project = projects[n - 1];
        const url = project.live_url || project.github_url;

        if (!url) {
          return { out: [`${project.title}: koi link nahi laga hai.`], err: true };
        }

        window.open(url, "_blank", "noopener,noreferrer");
        return { out: [`Opening ${project.title} ...`] };
      }

      case "skills":
        return {
          out: stack.length
            ? [stack.join("  ·  ")]
            : ["Skills abhi load nahi hui."],
        };

      case "hire-me":
      case "hire":
        return { out: hireMeLines() };

      case "contact":
        return {
          out: [
            `Email   : ${EMAIL}`,
            `GitHub  : ${GITHUB_URL}`,
            `LinkedIn: ${LINKEDIN_URL}`,
          ],
        };

      case "resume":
        if (!resumeUrl) {
          return { out: ["Resume abhi upload nahi hai."], err: true };
        }
        window.open(resumeUrl, "_blank", "noopener,noreferrer");
        return { out: ["Opening resume ..."] };

      case "sudo":
        if (args.join(" ").toLowerCase() === "hire-me") {
          return { out: ["Permission granted. Good decision. 🎉", ...hireMeLines()] };
        }
        return { out: ["Permission denied. Nice try though 😄"], err: true };

      case "coffee":
        return { out: ["☕ Brewing... Ishwar runs on chai actually."] };

      case "clear":
        return { out: ["__clear__"] };

      case "exit":
      case "quit":
        return { out: ["__exit__"] };

      default:
        return {
          out: [`command not found: ${cmd}. Type 'help'.`],
          err: true,
        };
    }
  }

  function submit() {
    const raw = input;
    const { out, err } = execute(raw);

    setHistory((prev) => (raw.trim() ? [raw, ...prev].slice(0, 30) : prev));
    setHistoryIndex(-1);
    setInput("");

    if (out[0] === "__clear__") {
      setLines([]);
      return;
    }

    if (out[0] === "__exit__") {
      setOpen(false);
      return;
    }

    setLines((prev) => [
      ...prev,
      ...makeLines("cmd", [raw]),
      ...makeLines(err ? "err" : "out", out),
    ]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submit();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      if (next >= 0) {
        setHistoryIndex(next);
        setInput(history[next]);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(next >= 0 ? history[next] : "");
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open terminal (shortcut: backtick key)"
          title="Terminal (press `)"
          className="fixed bottom-4 left-4 z-[70] rounded-lg border border-cyan-400/30 bg-black/70 px-3 py-2 font-mono text-xs text-cyan-300 opacity-90 backdrop-blur transition hover:border-cyan-400/60 hover:opacity-100"
        >
          &gt;_ terminal
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Terminal"
          className="fixed bottom-4 left-4 right-4 z-[80] overflow-hidden rounded-xl border border-cyan-400/20 bg-black/90 font-mono text-xs shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:right-auto sm:w-[580px]"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-neutral-500">ishwar@portfolio:~</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close terminal"
              className="ml-auto text-neutral-500 transition hover:text-white"
            >
              esc
            </button>
          </div>

          <div
            ref={bodyRef}
            className="max-h-64 space-y-0.5 overflow-y-auto px-4 py-3 leading-5"
          >
            {lines.map((line) => (
              <p
                key={line.id}
                className={`whitespace-pre-wrap break-words ${
                  line.kind === "cmd"
                    ? "text-cyan-300"
                    : line.kind === "err"
                    ? "text-red-300"
                    : "text-neutral-300"
                }`}
              >
                {line.kind === "cmd" ? `$ ${line.text}` : line.text}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5">
            <span className="text-emerald-400">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Terminal input"
              className="min-w-0 flex-1 bg-transparent text-neutral-100 outline-none placeholder:text-neutral-700"
              placeholder="help"
            />
          </div>
        </div>
      )}
    </>
  );
}
