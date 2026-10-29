"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Mail, X } from "lucide-react";

/* Floating "hire me" pill. Shows after the visitor scrolls past the hero,
   stays out of the way of the Ask AI button (bottom-right), and can be
   dismissed for the rest of the session. */

const KEY = "recruiter-bar-dismissed";

type Props = {
  resumeUrl: string;
  email: string;
  linkedin: string;
};

export default function RecruiterBar({ resumeUrl, email, linkedin }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {scrolled && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-3 right-28 z-[80] sm:left-6 sm:right-auto"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a]/90 py-2 pl-4 pr-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="mr-1 hidden whitespace-nowrap text-xs text-neutral-300 min-[420px]:inline">
              Open to work
            </span>

            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-cyan-200"
            >
              <Download size={13} /> Resume
            </a>

            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 px-3 py-1.5 text-xs text-white transition hover:border-cyan-300/50"
            >
              <Mail size={13} /> Hire me
            </a>

            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden whitespace-nowrap rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-cyan-300/50 hover:text-white md:inline"
            >
              LinkedIn
            </a>

            <button
              onClick={dismiss}
              aria-label="Close"
              className="rounded-full p-1.5 text-neutral-500 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}