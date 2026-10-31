"use client";

import { useEffect } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* =========================
   ANONYMOUS TRACKER
   - Visit: ek session me sirf ek baar
   - Clicks: project live/source, demo, resume, email, LinkedIn, GitHub
   Koi cookie ya IP store nahi hota. "Do Not Track" ON ho toh kuch nahi bhejta.
   Apne aap ko ginti se bahar rakhne ke liye site ek baar `?notrack` ke saath kholo
   (us browser me hamesha ke liye band ho jayega).
========================= */

function send(kind: string, name = "") {
  try {
    fetch(`${API}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name: name.slice(0, 200) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function classify(a: HTMLAnchorElement): { kind: string; name: string } | null {
  const href = a.getAttribute("href") || "";

  const card = a.closest<HTMLElement>("[data-project]");
  if (card) {
    const isLive = /live/i.test(a.textContent || "");
    return {
      kind: isLive ? "project_live" : "project_source",
      name: card.dataset.project || "",
    };
  }

  if (a.closest("#demo-status")) {
    const title = a.parentElement?.querySelector("p")?.textContent || "";
    return { kind: "demo_open", name: title };
  }

  if (href.startsWith("mailto:")) return { kind: "email_click", name: "" };
  if (href.includes("linkedin.com")) return { kind: "linkedin_click", name: "" };
  if (href.includes("github.com")) return { kind: "github_click", name: "" };
  if (href.includes("/api/files/")) return { kind: "resume_click", name: "" };

  return null;
}

export default function Tracker() {
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has("notrack")) {
        localStorage.setItem("ishwar-no-track", "1");
      }

      if (
        localStorage.getItem("ishwar-no-track") === "1" ||
        navigator.doNotTrack === "1"
      ) {
        return;
      }
    } catch {
      /* storage band ho toh bhi chalne do */
    }

    try {
      if (!sessionStorage.getItem("ishwar-visit")) {
        sessionStorage.setItem("ishwar-visit", "1");
        send("visit");
      }
    } catch {
      /* ignore */
    }

    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const info = classify(anchor as HTMLAnchorElement);
      if (info) send(info.kind, info.name);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
