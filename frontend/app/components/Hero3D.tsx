"use client";

import { useEffect, useRef } from "react";

/* =========================
   3D INTERACTIVE HERO
   Pure canvas (koi extra library nahi). Rotating 3D point-cloud jo mouse ke
   saath tilt hota hai. Mobile pe kam points, off-screen ya hidden tab pe pause,
   aur "reduced motion" setting pe sirf ek static frame.
========================= */

type Point = { x: number; y: number; z: number };

export default function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const context = canvasEl.getContext("2d");
    if (!context) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const isSmall = window.innerWidth < 768;
    const COUNT = isSmall ? 48 : 96;
    const LINK_DISTANCE = isSmall ? 0.7 : 0.58;
    const PERSPECTIVE = 2.6;

    // Fibonacci sphere: points sphere pe barabar failte hain
    const points: Point[] = Array.from({ length: COUNT }, (_, i) => {
      const k = i + 0.5;
      const phi = Math.acos(1 - (2 * k) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * k;
      const radius = 0.8 + Math.random() * 0.2;

      return {
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
      };
    });

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    let mouseX = 0;
    let mouseY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let spin = 0;
    let frame = 0;
    let running = false;
    let visible = true;

    function onMouseMove(event: MouseEvent) {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // mouse ki taraf smoothly tilt
      tiltX += (mouseY * 0.55 - tiltX) * 0.05;
      tiltY += (mouseX * 0.8 - tiltY) * 0.05;

      const angleY = spin + tiltY;
      const angleX = tiltX;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.42;

      const projected = points.map((p) => {
        // Y axis rotation
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        // X axis rotation
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const factor = PERSPECTIVE / (PERSPECTIVE + z2);

        return {
          sx: cx + x1 * scale * factor,
          sy: cy + y2 * scale * factor,
          depth: (z2 + 1) / 2, // 0 (peeche) .. 1 (aage)
          rx: x1,
          ry: y2,
          rz: z2,
          factor,
        };
      });

      // links
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.rx - b.rx;
          const dy = a.ry - b.ry;
          const dz = a.rz - b.rz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < LINK_DISTANCE) {
            const strength = 1 - dist / LINK_DISTANCE;
            const alpha = strength * 0.38 * ((a.depth + b.depth) / 2 + 0.2);

            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // nodes (door wale chhote aur halke, paas wale bade aur chamakdar)
      projected.forEach((p, index) => {
        const size = 1.2 + p.depth * 2.4 * p.factor;
        const alpha = 0.25 + p.depth * 0.75;
        const violet = index % 5 === 0;

        ctx.fillStyle = violet
          ? `rgba(167, 139, 250, ${alpha.toFixed(3)})`
          : `rgba(103, 232, 249, ${alpha.toFixed(3)})`;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();

        if (p.depth > 0.7) {
          ctx.fillStyle = violet
            ? "rgba(167, 139, 250, 0.08)"
            : "rgba(34, 211, 238, 0.08)";
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    function loop() {
      if (!running) return;
      spin += 0.0035;
      draw();
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (reduceMotion || running || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw();
    });

    observer.observe(canvas);
    resizeObserver.observe(canvas);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    draw();
    start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-full opacity-50 md:w-[62%] md:opacity-100"
      style={{
        maskImage:
          "radial-gradient(closest-side, black 55%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(closest-side, black 55%, transparent 100%)",
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
