"use client";

import { useState } from "react";
import { Mail, MapPin } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const GITHUB_URL = "https://github.com/ishwardhakad779-a11y";
const LINKEDIN_URL = "https://www.linkedin.com/in/ishwar-dhakad-213b503b0";
const EMAIL = "ishwardhakad779@gmail.com";

// Photo admin panel se upload hoti hai (Profile photo section).
// Photo na ho toh naam ke initials dikhte hain.
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const PHOTO_SRC = `${API}/profile-photo`;

const links = [
  { label: "GitHub", href: GITHUB_URL, Icon: FaGithub, external: true },
  { label: "LinkedIn", href: LINKEDIN_URL, Icon: FaLinkedin, external: true },
  { label: "Email", href: `mailto:${EMAIL}`, Icon: Mail, external: false },
];

/* Ye saari values admin panel (Profile form) se aati hain.
   Khali ya na mile toh neeche ke default dikhte hain. */
type Props = {
  name?: string;
  headline?: string;
  bio?: string;
  availability?: string;
};

export default function ProfileSection({
  name,
  headline,
  bio,
  availability,
}: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);

  const shownName = name?.trim() || "Ishwar Dhakad";
  const shownHeadline = headline?.trim() || "Agentic AI & Python Backend Engineer";
  const shownBio =
    bio?.trim() ||
    "Self-taught developer building agentic AI systems with LangGraph, FastAPI and RAG. Founder of ISH Digital Studio.";
  const shownAvailability =
    availability?.trim() || "Open to internships & entry-level Agentic AI roles";

  const initials =
    shownName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "ID";

  return (
    <section
      id="profile"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl">
        {/* banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950" />

        <div className="p-6 sm:p-8">
          {/* avatar */}
          <div className="-mt-20 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#050505] bg-indigo-600 text-3xl font-black text-white shadow-2xl sm:-mt-24 sm:h-32 sm:w-32">
            {photoFailed ? (
              initials
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PHOTO_SRC}
                alt={shownName}
                className="h-full w-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            {shownName}
          </h2>

          <p className="mt-1 text-base text-neutral-300">{shownHeadline}</p>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin size={14} />
            Indore, India
          </p>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
            {shownBio}
          </p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {shownAvailability}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(({ label, href, Icon, external }) => (
              <a
                key={label}
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-neutral-300 transition hover:border-cyan-400/40 hover:text-white"
              >
                <Icon size={15} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
