"use client";

import { useEffect, useRef } from "react";

/* =========================
   CURSOR GLOW + CARD SPOTLIGHT
   1. Mouse ke peeche halki cyan roshni (smooth follow).
   2. `.spotlight` class wale cards pe mouse ki position CSS variables
      (--mx, --my) me set karta hai, glow globals.css banata hai.
   Touch devices aur "reduced motion" pe band rehta hai.
========================= */

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glowEl = glowRef.current;
    if (!glowEl) return;

    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!canHover || reduceMotion) return;

    const glow: HTMLDivElement = glowEl;
    const HALF = 200; // glow 400px ka hai

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let frame = 0;
    let looping = false;

    function tick() {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;

      glow.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0)`;

      // Jab glow pahunch jaye toh loop band, CPU bachao
      if (Math.abs(targetX - x) < 0.5 && Math.abs(targetY - y) < 0.5) {
        looping = false;
        return;
      }

      frame = requestAnimationFrame(tick);
    }

    function onMove(event: MouseEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.style.opacity = "1";

      if (!looping) {
        looping = true;
        frame = requestAnimationFrame(tick);
      }

      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>(".spotlight");

      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }
    }

    function onLeave() {
      glow.style.opacity = "0";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[400px] w-[400px] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.04) 35%, transparent 65%)",
      }}
    />
  );
}
