"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* =========================================================
   Shared helpers
   ========================================================= */

// SSR pe useLayoutEffect warning se bachne ke liye
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* =========================================================
   ScrambleText
   Heading scroll pe aate hi random letters se resolve hoti hai.
   - SSR / JS band / reduced-motion: seedha asli text dikhta hai
   - Screen readers ko hamesha asli text milta hai
   ========================================================= */

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function scramble(text: string, resolved: number) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (i < resolved || !/[A-Za-z0-9]/.test(ch)) out += ch;
    else out += POOL[Math.floor(Math.random() * POOL.length)];
  }
  return out;
}

export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    let started = false;
    let cancelled = false;

    // pehle scrambled dikhao (paint se pehle), phir scroll pe resolve karo
    setDisplay(scramble(text, 0));

    const run = () => {
      if (started || cancelled) return;
      started = true;
      const duration = Math.min(1100, 500 + text.length * 22);
      const begin = performance.now();
      let last = 0;

      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - begin) / duration);
        if (now - last > 45 || progress === 1) {
          last = now;
          setDisplay(progress === 1 ? text : scramble(text, Math.floor(easeOutCubic(progress) * text.length)));
        }
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/* =========================================================
   CountUp
   Number view mein aate hi 0 se value tak chadhta hai.
   Value badle (jaise API se data aaye) to current se naye tak jata hai.
   ========================================================= */

export function CountUp({
  value,
  pad = 0,
  suffix = "",
  duration = 1000,
  className,
}: {
  value: number;
  pad?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const [display, setDisplay] = useState(value);
  const [visible, setVisible] = useState(false);

  const format = (n: number) => `${String(Math.round(n)).padStart(pad, "0")}${suffix}`;

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    shown.current = 0;
    setDisplay(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          setVisible(true);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // sirf mount pe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      shown.current = value;
      return;
    }
    if (!visible) return;

    const from = shown.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }

    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / duration);
      const current = from + (to - from) * easeOutCubic(progress);
      shown.current = current;
      setDisplay(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, visible, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {format(display)}
    </span>
  );
}

/* =========================================================
   MagneticEffect
   Ek baar page pe lagao. Jis element pe data-magnetic ho, wo cursor ki
   taraf halka sa khichta hai. Touch devices aur reduced-motion pe band.
   ========================================================= */

const MAGNETIC_CSS = `
a[data-magnetic], button[data-magnetic] {
  will-change: translate;
  transition: color .15s, background-color .15s, border-color .15s, opacity .15s,
    translate .45s cubic-bezier(.22, 1, .36, 1);
}
a[data-magnetic][data-magnetic-active], button[data-magnetic][data-magnetic-active] {
  transition: color .15s, background-color .15s, border-color .15s, opacity .15s,
    translate .12s ease-out;
}
`;

export function MagneticEffect() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return;

    const STRENGTH = 0.32;
    const MAX = 10; // px
    const REACH = 56; // element ke bahar kitni door se khichna shuru

    let frame = 0;
    let mouseX = 0;
    let mouseY = 0;
    const active = new Set<HTMLElement>();

    const reset = (el: HTMLElement) => {
      el.style.translate = "0 0";
      el.removeAttribute("data-magnetic-active");
      active.delete(el);
    };

    const update = () => {
      frame = 0;
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const offscreen = rect.bottom < 0 || rect.top > window.innerHeight;
        if (offscreen || rect.width === 0) {
          if (active.has(el)) reset(el);
          return;
        }

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const inside =
          Math.abs(dx) < rect.width / 2 + REACH && Math.abs(dy) < rect.height / 2 + REACH;

        if (inside) {
          const x = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
          const y = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
          el.setAttribute("data-magnetic-active", "");
          el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
          active.add(el);
        } else if (active.has(el)) {
          reset(el);
        }
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resetAll = () => Array.from(active).forEach(reset);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", resetAll);
    document.addEventListener("pointerleave", resetAll);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", resetAll);
      document.removeEventListener("pointerleave", resetAll);
      if (frame) cancelAnimationFrame(frame);
      resetAll();
    };
  }, []);

  return <style>{MAGNETIC_CSS}</style>;
}
