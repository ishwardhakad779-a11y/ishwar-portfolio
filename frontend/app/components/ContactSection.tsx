"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Download, Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

type Props = {
  email: string;
  linkedin: string;
  github: string;
  availability?: string;
  resumeUrl?: string;
};

export default function ContactSection({
  email,
  linkedin,
  github,
  availability,
  resumeUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard allowed nahi, mailto button kaam karega */
    }
  }

  const cards = [
    {
      title: "LinkedIn",
      sub: "Connect or send a message",
      href: linkedin,
      Icon: FaLinkedin,
    },
    {
      title: "GitHub",
      sub: "See the code behind the demos",
      href: github,
      Icon: FaGithub,
    },
    ...(resumeUrl
      ? [
          {
            title: "Resume",
            sub: "Download the latest PDF",
            href: resumeUrl,
            Icon: Download,
          },
        ]
      : []),
  ];

  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-7 sm:p-14">
          {/* glows */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/[0.14] blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-violet-500/[0.14] blur-[110px]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
            {/* left */}
            <div>
              {availability?.trim() && (
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  {availability.trim()}
                </p>
              )}

              <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Have an idea
                <span className="gradient-text block">worth building?</span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-8 text-neutral-400">
                I build AI agents, RAG systems and FastAPI backends. If you are
                hiring, or have a problem that needs an intelligent system, send
                me a note. I read every message.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${email}`}
                  data-magnetic
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-200"
                >
                  <Mail size={16} />
                  Email me
                </a>

                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-sm text-neutral-300 transition hover:border-cyan-400/40 hover:text-white"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied!" : email}
                </button>
              </div>
            </div>

            {/* right */}
            <div className="grid gap-3">
              {cards.map(({ title, sub, href, Icon }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300">
                    <Icon size={18} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {sub}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="text-neutral-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
