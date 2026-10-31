"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Coffee,
  Dumbbell,
  Stethoscope,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/* "Websites I build" strip.
   These are concept / demo builds made under ISH Digital Studio to pitch
   to local businesses. They are NOT presented as paid client projects.
   To add or remove a demo, edit the DEMOS list below. */

const STUDIO_URL = "https://ish-digital-studio.vercel.app";

type Demo = {
  name: string;
  kind: string;
  url: string;
  icon: LucideIcon;
  tags: string[];
};

const DEMOS: Demo[] = [
  {
    name: "Aarcan Restaurant",
    kind: "Restaurant website",
    url: "https://aarcan-restaurant.vercel.app",
    icon: Utensils,
    tags: ["Menu", "Reservations", "Responsive"],
  },
  {
    name: "Premium Medical Clinic",
    kind: "Clinic website",
    url: "https://premium-medical-clinic-seven.vercel.app",
    icon: Stethoscope,
    tags: ["Services", "Appointments", "Responsive"],
  },
  {
    name: "Luxury Gym",
    kind: "Fitness club website",
    url: "https://luxury-gym-website-eta.vercel.app",
    icon: Dumbbell,
    tags: ["Memberships", "Trainers", "Responsive"],
  },
  {
    name: "Premium Cafe",
    kind: "Cafe website",
    url: "https://premium-cofe-website.vercel.app",
    icon: Coffee,
    tags: ["Menu", "Gallery", "Responsive"],
  },
];

export default function StudioDemos() {
  return (
    <section
      id="studio"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
              ISH Digital Studio
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              I also build websites.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Concept websites for local businesses, built under my freelance
              studio. These are demo builds I make to pitch to businesses, not
              paid client projects.
            </p>
          </div>

          <a
            href={STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-300 transition hover:border-cyan-300/50 hover:text-white"
          >
            Visit the studio <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((demo, index) => {
            const Icon = demo.icon;

            return (
              <motion.a
                key={demo.url}
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-violet-400/15"
                />

                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-cyan-300">
                  <Icon size={20} />
                </div>

                <p className="relative mt-5 text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                  {demo.kind}
                </p>

                <h3 className="relative mt-2 flex items-center justify-between gap-2 text-lg font-medium tracking-tight text-white">
                  {demo.name}
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-neutral-600 transition group-hover:text-cyan-300"
                  />
                </h3>

                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {demo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[11px] text-neutral-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="relative mt-4 text-[11px] text-neutral-600">
                  Demo build
                </p>
              </motion.a>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}