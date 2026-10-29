"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Menu,
  X,
  ExternalLink,
  FileText,
  LogOut,
  Trash2,
  Upload,
} from "lucide-react";
import AgentWorkflows from "./components/AgentWorkflows";
import AskAI from "./components/AskAI";
import ProfileSection from "./components/ProfileSection";
import Hero3D from "./components/Hero3D";
import LiveAgent from "./components/LiveAgent";
import GithubActivity from "./components/GithubActivity";
import RecruiterBar from "./components/RecruiterBar";
import DemoStatus from "./components/DemoStatus";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import HeroTerminal from "./components/HeroTerminal";
import IncidentSimulator from "./components/IncidentSimulator";
import { CountUp, MagneticEffect, ScrambleText } from "./components/MicroInteractions";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

const BACKEND = API.replace(/\/api$/, "");

// Admin write calls (POST/PUT/DELETE) Next.js proxy se jaate hain,
// jo login cookie check karke backend ko secret key ke saath call karta hai.
const ADMIN_API = "/api/admin-proxy";
/* =========================
   FIXED PERSONAL LINKS
========================= */

const GITHUB_URL = "https://github.com/ishwardhakad779-a11y";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/ishwar-dhakad-213b503b0";

const EMAIL = "ishwardhakad779@gmail.com";

/* =========================
   TYPES
========================= */

type Project = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string;
  live_url: string;
  github_url: string;
  image_url: string;
  featured: boolean;
  display_order: number;
};

type StackItem = {
  id: number;
  name: string;
  display_order: number;
};

type Profile = {
  id: number;
  name: string;
  headline: string;
  bio: string;
  email: string;
  availability: string;
};

type Resume = {
  id: number;
  file_url: string;
  file_name: string;
};

/* =========================
   FALLBACK PROFILE
========================= */

type JDMatch = {
  match_percent: number;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  relevant_projects: { title: string; reason: string }[];
  pitch: string;
};

const fallbackProfile: Profile = {
  id: 0,
  name: "Ishwar Dhakad",
  headline: "GenAI & Agentic AI Developer",
  bio: "I build intelligent systems using Agentic AI, Generative AI, Python backends, LLMs, RAG and modern AI engineering tools.",
  email: EMAIL,
  availability: "Open to remote & on-site opportunities",
};

/* =========================
   FALLBACK PROJECTS
========================= */

const fallbackProjects: Project[] = [
  {
    id: 1,
    title: "Incident Response AI",
    description:
      "An AI-powered incident response system designed to analyze incidents and assist with intelligent investigation and response workflows.",
    category: "Agentic AI",
    tags: "Python, FastAPI, LangGraph, LLM",
    live_url: "https://incident-response-ai.onrender.com/",
    github_url:
      "https://github.com/ishwardhakad779-a11y/-Incident_-AI",
    image_url: "",
    featured: true,
    display_order: 1,
  },
  {
    id: 2,
    title: "AI Research Assistant",
    description:
      "An AI research assistant that helps users search, analyze and summarize information using modern LLM and retrieval workflows.",
    category: "Generative AI",
    tags: "Python, FastAPI, RAG, LLM",
    live_url:
      "https://ai-research-assistant-7a2a.onrender.com/",
    github_url:
      "https://github.com/ishwardhakad779-a11y/AI_Research_Assistant",
    image_url: "",
    featured: true,
    display_order: 2,
  },
  {
    id: 3,
    title: "YojanaSaathi",
    description:
      "A Hinglish AI agent that helps users understand Indian government schemes and find relevant benefits through conversational interaction.",
    category: "Agentic AI",
    tags: "FastAPI, LangGraph, AI Agent, Streamlit",
    live_url:
      "https://yojana-saathi-fb30.onrender.com/",
    github_url:
      "https://github.com/ishwardhakad779-a11y/Yojana_sathi",
    image_url: "",
    featured: true,
    display_order: 3,
  },
];

/* =========================
   FALLBACK STACK
========================= */

const fallbackStack = [
  "Python",
  "FastAPI",
  "LangGraph",
  "LangChain",
  "RAG",
  "LLM APIs",
  "PostgreSQL",
  "Docker",
  "Vector Databases",
  "REST APIs",
  "AWS",
  "Git & GitHub",
];

const categories = [
  "All",
  "Agentic AI",
  "Generative AI",
  "Backend",
  "Web Development",
];

/* =========================
   HELPERS
========================= */

function imageUrl(path: string) {
  if (!path) return "";

  if (path.startsWith("http")) {
    return path;
  }

  return `${BACKEND}${path}`;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/* =========================
   CUSTOM GITHUB ICON
========================= */

function GitHubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.15c-3.2.69-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

/* =========================
   CUSTOM LINKEDIN ICON
========================= */

function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.75 9.5h4.46V21H2.75V9.5Zm7.25 0h4.28v1.57h.06c.6-1.13 2.06-2.32 4.24-2.32 4.53 0 5.37 2.98 5.37 6.86V21h-4.45v-4.78c0-1.14-.02-2.61-1.59-2.61-1.59 0-1.83 1.24-1.83 2.52V21H10V9.5Z" />
    </svg>
  );
}


/* =========================
   INLINE ADMIN PANEL
========================= */

type AdminProject = Project;

type AdminProfile = Profile & { github: string; linkedin: string };

const emptyAdminProject: AdminProject = {
  id: 0,
  title: "",
  description: "",
  category: "Agentic AI",
  tags: "",
  live_url: "",
  github_url: "",
  image_url: "",
  featured: false,
  display_order: 0,
};

function InlineAdminPanel({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [stackItems, setStackItems] = useState<StackItem[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    id: 0,
    name: "Ishwar Dhakad",
    headline: "GenAI & Agentic AI Developer",
    bio: "",
    email: EMAIL,
    github: GITHUB_URL,
    linkedin: LINKEDIN_URL,
    availability: "Open to remote & on-site opportunities",
  });
  const [resume, setResume] = useState<Resume | null>(null);
  const [projectForm, setProjectForm] = useState(emptyAdminProject);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [stackName, setStackName] = useState("");
  const [stackOrder, setStackOrder] = useState(0);
  const [editingStackId, setEditingStackId] = useState<number | null>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoVersion, setPhotoVersion] = useState(() => Date.now());
  const [photoBroken, setPhotoBroken] = useState(false);

  async function loadAdminData() {
    try {
      const [p, s, pr, r] = await Promise.all([
        fetch(`${API}/projects`),
        fetch(`${API}/stack`),
        fetch(`${API}/profile`),
        fetch(`${API}/resume`),
      ]);
      if (p.ok) setProjects(await p.json());
      if (s.ok) setStackItems(await s.json());
      if (pr.ok) {
        const data = await pr.json();
        if (data) setAdminProfile((old) => ({ ...old, ...data }));
      }
      if (r.ok) setResume(await r.json());
    } catch (e) {
      console.error(e);
      setError("Admin data load nahi hua.");
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function handleProjectChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setProjectForm((old) => ({
      ...old,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : name === "display_order" ? Number(value) : value,
    }));
  }

  async function saveProject(e: FormEvent) {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      setError("Project title aur description required hai.");
      return;
    }
    try {
      setBusy(true); setError(""); setMessage("");
      const url = editingProjectId ? `${ADMIN_API}/projects/${editingProjectId}` : `${ADMIN_API}/projects`;
      const response = await fetch(url, {
        method: editingProjectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectForm, id: undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Project save failed");
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const imageResponse = await fetch(`${ADMIN_API}/projects/${data.id}/image`, { method: "POST", body: formData });
        if (!imageResponse.ok) throw new Error("Project image upload failed");
      }
      setProjectForm(emptyAdminProject); setEditingProjectId(null); setSelectedImage(null);
      setMessage(editingProjectId ? "Project updated successfully." : "Project added successfully.");
      await loadAdminData();
    } catch (e) {
      console.error(e); setError(e instanceof Error ? e.message : "Project save nahi hua.");
    } finally { setBusy(false); }
  }

  function editProject(project: AdminProject) {
    setEditingProjectId(project.id);
    setProjectForm({ ...project });
    setSelectedImage(null);
  }

  async function regenerateCover(id: number, replaceUpload = false) {
    let needsConfirm = "";

    try {
      setBusy(true); setError(""); setMessage("");
      const response = await fetch(`${ADMIN_API}/projects/${id}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace_upload: replaceUpload }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 409) {
        needsConfirm = data?.detail || "Is project me upload ki hui image lagi hai.";
      } else {
        if (!response.ok) throw new Error(data?.detail || "Cover generate nahi hua.");
        setMessage("Naya cover lag gaya.");
        await loadAdminData();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cover generate nahi hua.");
    } finally {
      setBusy(false);
    }

    if (needsConfirm && window.confirm(`${needsConfirm}\n\nAuto cover se badalna hai?`)) {
      await regenerateCover(id, true);
    }
  }

  async function fillCovers() {
    try {
      setBusy(true); setError(""); setMessage("");
      const response = await fetch(`${ADMIN_API}/projects/covers/fill`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Covers generate nahi hue.");
      setMessage(
        data?.created
          ? `${data.created} projects ko auto cover mil gaya.`
          : "Sabhi projects me image pehle se hai."
      );
      await loadAdminData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Covers generate nahi hue.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject(id: number) {
    if (!window.confirm("Ye project delete karna hai?")) return;
    try {
      setBusy(true);
      const response = await fetch(`${ADMIN_API}/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setMessage("Project deleted successfully.");
      await loadAdminData();
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setBusy(false); }
  }

  async function saveStack(e: FormEvent) {
    e.preventDefault();
    if (!stackName.trim()) return setError("Technology name required hai.");
    try {
      setBusy(true); setError("");
      const response = await fetch(editingStackId ? `${ADMIN_API}/stack/${editingStackId}` : `${ADMIN_API}/stack`, {
        method: editingStackId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: stackName.trim(), display_order: Number(stackOrder) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Stack save failed");
      setStackName(""); setStackOrder(0); setEditingStackId(null);
      setMessage(editingStackId ? "Technology updated." : "Technology added.");
      await loadAdminData();
    } catch (e) { setError(e instanceof Error ? e.message : "Stack save failed."); }
    finally { setBusy(false); }
  }

  async function deleteStack(id: number) {
    if (!window.confirm("Ye technology delete karni hai?")) return;
    try {
      setBusy(true);
      const response = await fetch(`${ADMIN_API}/stack/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Stack delete failed");
      await loadAdminData(); setMessage("Technology deleted.");
    } catch (e) { setError(e instanceof Error ? e.message : "Stack delete failed."); }
    finally { setBusy(false); }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    try {
      setBusy(true); setError("");
      const response = await fetch(`${ADMIN_API}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminProfile),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Profile save failed");
      setAdminProfile((old) => ({ ...old, ...data })); setMessage("Profile saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Profile save failed."); }
    finally { setBusy(false); }
  }

  async function uploadResume() {
    if (!selectedResume) return setError("Pehle PDF select karo.");
    try {
      setBusy(true); setError("");
      const formData = new FormData(); formData.append("file", selectedResume);
      const response = await fetch(`${ADMIN_API}/resume/upload`, { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Resume upload failed");
      setResume(data); setSelectedResume(null); setMessage("Resume successfully updated.");
      const input = document.getElementById("inline-resume-upload") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e) { setError(e instanceof Error ? e.message : "Resume upload failed."); }
    finally { setBusy(false); }
  }

  async function deleteResume() {
    if (!window.confirm("Current resume delete karna hai?")) return;
    try {
      setBusy(true);
      const response = await fetch(`${ADMIN_API}/resume`, { method: "DELETE" });
      if (!response.ok) throw new Error("Resume delete failed");
      setResume(null); setMessage("Resume deleted.");
    } catch (e) { setError(e instanceof Error ? e.message : "Resume delete failed."); }
    finally { setBusy(false); }
  }

  async function uploadPhoto() {
    if (!photoFile) return setError("Pehle photo select karo.");
    try {
      setBusy(true); setError(""); setMessage("");
      const formData = new FormData(); formData.append("file", photoFile);
      const response = await fetch(`${ADMIN_API}/profile-photo`, { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Photo upload failed");
      setPhotoFile(null); setPhotoBroken(false); setPhotoVersion(Date.now());
      setMessage("Profile photo updated.");
      const input = document.getElementById("inline-photo-upload") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e) { setError(e instanceof Error ? e.message : "Photo upload failed."); }
    finally { setBusy(false); }
  }

  async function deletePhoto() {
    if (!window.confirm("Profile photo hatani hai?")) return;
    try {
      setBusy(true); setError("");
      const response = await fetch(`${ADMIN_API}/profile-photo`, { method: "DELETE" });
      if (!response.ok) throw new Error("Photo delete failed");
      setPhotoBroken(true); setPhotoVersion(Date.now());
      setMessage("Profile photo removed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Photo delete failed."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin-logout", { method: "POST" }).catch(() => null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="sticky top-0 z-10 mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#050505]/95 py-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400">Portfolio CMS</p>
            <h2 className="mt-1 text-2xl font-semibold">Manage Portfolio</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/[0.06]">View Portfolio</button>
            <button onClick={logout} className="flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-xs text-red-300 hover:bg-red-400/[0.06]"><LogOut size={13}/> Logout</button>
          </div>
        </header>

        {message && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-300">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Profile photo</p>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-indigo-600 text-2xl font-black">
              {photoBroken ? (
                "ID"
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API}/profile-photo?v=${photoVersion}`}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                  onError={() => setPhotoBroken(true)}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor="inline-photo-upload" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-neutral-400"><Upload size={16}/>{photoFile ? photoFile.name : "Choose photo (JPG, PNG ya WEBP, max 3 MB)"}</label>
              <input id="inline-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>setPhotoFile(e.target.files?.[0] || null)}/>
              <div className="mt-3 flex gap-2">
                <button onClick={uploadPhoto} disabled={busy || !photoFile} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{photoBroken ? "Upload Photo" : "Replace Photo"}</button>
                {!photoBroken && <button onClick={deletePhoto} disabled={busy} className="rounded-xl border border-red-400/20 px-5 py-3 text-sm text-red-300 disabled:opacity-40">Remove</button>}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Profile</p>
            <form onSubmit={saveProfile} className="mt-5 grid gap-4">
              <input value={adminProfile.name} onChange={(e)=>setAdminProfile({...adminProfile,name:e.target.value})} placeholder="Name" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
              <input value={adminProfile.headline} onChange={(e)=>setAdminProfile({...adminProfile,headline:e.target.value})} placeholder="Headline" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
              <textarea value={adminProfile.bio} onChange={(e)=>setAdminProfile({...adminProfile,bio:e.target.value})} rows={4} placeholder="Bio" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
              <input value={adminProfile.availability} onChange={(e)=>setAdminProfile({...adminProfile,availability:e.target.value})} placeholder="Availability" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
              <button disabled={busy} className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">Save Profile</button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Resume</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              {resume ? <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><FileText size={20} className="text-cyan-300"/><span className="truncate text-sm">{resume.file_name}</span></div><div className="flex gap-2"><a href={`${BACKEND}${resume.file_url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs"><ExternalLink size={13}/></a><button onClick={deleteResume} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300"><Trash2 size={13}/></button></div></div> : <p className="text-sm text-neutral-500">No resume uploaded.</p>}
            </div>
            <label htmlFor="inline-resume-upload" className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-neutral-400"><Upload size={16}/>{selectedResume ? selectedResume.name : "Choose PDF resume"}</label>
            <input id="inline-resume-upload" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e)=>setSelectedResume(e.target.files?.[0] || null)}/>
            <button onClick={uploadResume} disabled={busy || !selectedResume} className="mt-3 w-full rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-40">{resume ? "Replace Resume" : "Upload Resume"}</button>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Projects</p><h3 className="mt-2 text-xl font-semibold">{editingProjectId ? "Edit Project" : "Add Project"}</h3></div><span className="text-xs text-neutral-600">{projects.length} projects</span><button type="button" onClick={fillCovers} disabled={busy} className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs text-cyan-200 disabled:opacity-40">Auto cover: jin me image nahi</button></div>
          <form onSubmit={saveProject} className="grid gap-4 lg:grid-cols-2">
            <input name="title" value={projectForm.title} onChange={handleProjectChange} placeholder="Project title" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
            <select name="category" value={projectForm.category} onChange={handleProjectChange} className="rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm outline-none">{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select>
            <textarea name="description" value={projectForm.description} onChange={handleProjectChange} rows={4} placeholder="Description" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none lg:col-span-2"/>
            <input name="tags" value={projectForm.tags} onChange={handleProjectChange} placeholder="Python, FastAPI, LangGraph" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
            <input name="display_order" type="number" value={projectForm.display_order} onChange={handleProjectChange} placeholder="Display order" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
            <input name="live_url" value={projectForm.live_url} onChange={handleProjectChange} placeholder="Live URL" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
            <input name="github_url" value={projectForm.github_url} onChange={handleProjectChange} placeholder="GitHub URL" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e)=>setSelectedImage(e.target.files?.[0] || null)} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-neutral-500 lg:col-span-2"/>
            <label className="flex items-center gap-3 text-sm text-neutral-400"><input type="checkbox" name="featured" checked={projectForm.featured} onChange={handleProjectChange}/> Featured Project</label>
            <div className="flex gap-2 lg:justify-end"><button disabled={busy} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">{editingProjectId ? "Update Project" : "Add Project"}</button>{editingProjectId && <button type="button" onClick={()=>{setEditingProjectId(null);setProjectForm(emptyAdminProject);setSelectedImage(null)}} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Cancel</button>}</div>
          </form>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {projects.map(p=><div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-4">{p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl(p.image_url)} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />
            ) : (
              <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-neutral-600">Image nahi hai</div>
            )}<div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400">{p.category}</p><h4 className="mt-1 font-medium">{p.title}</h4></div>{p.featured && <span className="text-[10px] text-cyan-300">Featured</span>}</div><p className="mt-2 line-clamp-2 text-xs text-neutral-500">{p.description}</p><div className="mt-3 flex gap-2"><button onClick={()=>editProject(p)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Edit</button><button onClick={()=>regenerateCover(p.id)} disabled={busy} className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs text-cyan-200 disabled:opacity-40">Regenerate cover</button><button onClick={()=>deleteProject(p.id)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300">Delete</button></div></div>)}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Technology</p><h3 className="mt-2 text-xl font-semibold">Tech Stack</h3>
          <form onSubmit={saveStack} className="mt-5 flex flex-wrap gap-3"><input value={stackName} onChange={e=>setStackName(e.target.value)} placeholder="Technology name" className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/><input type="number" value={stackOrder} onChange={e=>setStackOrder(Number(e.target.value))} className="w-28 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"/><button disabled={busy} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">{editingStackId ? "Update" : "Add"}</button></form>
          <div className="mt-5 flex flex-wrap gap-2">{stackItems.map(item=><div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"><span>{item.name}</span><button onClick={()=>{setEditingStackId(item.id);setStackName(item.name);setStackOrder(item.display_order)}} className="text-xs text-neutral-500 hover:text-white">Edit</button><button onClick={()=>deleteStack(item.id)} className="text-xs text-red-300">Delete</button></div>)}</div>
        </section>

        <p className="py-10 text-center text-xs text-neutral-700">Private portfolio management</p>
      </div>
    </div>
  );
}

/* =========================
   HOME
========================= */

export default function Home() {
  const [profile, setProfile] =
    useState<Profile>(fallbackProfile);

  const [projects, setProjects] =
    useState<Project[]>(fallbackProjects);

  const [stack, setStack] =
    useState<string[]>(fallbackStack);

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [currentYear, setCurrentYear] =
    useState<number | null>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [jdMatch, setJdMatch] = useState<JDMatch | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [logoClicks, setLogoClicks] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [resumeUrl, setResumeUrl] =
    useState("/resume.pdf");

  const [resumeFileName, setResumeFileName] =
    useState("Ishwar_Dhakad_Resume.pdf");

  /* =========================
     LOAD BACKEND DATA
  ========================= */

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    async function loadPortfolio() {
      try {
        const [
          profileRes,
          projectsRes,
          stackRes,
          resumeRes,
        ] = await Promise.all([
          fetch(`${API}/profile`),
          fetch(`${API}/projects`),
          fetch(`${API}/stack`),
          fetch(`${API}/resume`),
        ]);

        /* PROFILE */

        if (profileRes.ok) {
          const data = await profileRes.json();

          if (data) {
            setProfile({
              ...fallbackProfile,
              ...data,
              email: EMAIL,
            });
          }
        }

        /* PROJECTS */

        if (projectsRes.ok) {
          const data: Project[] =
            await projectsRes.json();

          if (
            Array.isArray(data) &&
            data.length > 0
          ) {
            setProjects(data);
          }
        }

        /* STACK */

        if (stackRes.ok) {
          const data: StackItem[] =
            await stackRes.json();

          if (
            Array.isArray(data) &&
            data.length > 0
          ) {
            setStack(
              data.map((item) => item.name)
            );
          }
        }

        /* RESUME */

        if (resumeRes.ok) {
          const data: Resume = await resumeRes.json();

          if (data?.file_url) {
            const publicResumeUrl = data.file_url.startsWith("http")
              ? data.file_url
              : `${BACKEND}${data.file_url}`;

            setResumeUrl(publicResumeUrl);
            setResumeFileName(
              data.file_name || "Ishwar_Dhakad_Resume.pdf"
            );
          }
        }
      } catch (error) {
        console.error(
          "Portfolio backend error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  /* JD Match result aate hi portfolio us role ke hisaab se badal jata hai */
  useEffect(() => {
    function onMatch(event: Event) {
      const detail = (event as CustomEvent<JDMatch>).detail;

      if (detail) {
        setJdMatch(detail);
        setActiveCategory("All");
      }
    }

    window.addEventListener("jd-match", onMatch);
    return () => window.removeEventListener("jd-match", onMatch);
  }, []);

  async function openAdminLogin() {
    setAdminError("");
    setAdminLoginOpen(true);
  }

  async function submitAdminLogin(e: FormEvent) {
    e.preventDefault();
    setAdminError("");
    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || data?.message || "Invalid admin credentials.");
      setAdminLoginOpen(false);
      setAdminOpen(true);
      setAdminUsername("");
      setAdminPassword("");
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : "Login failed.");
    }
  }

  function handleLogoAdminClick() {
    setLogoClicks((old) => {
      const next = old + 1;
      if (logoClickTimer) clearTimeout(logoClickTimer);
      const timer = setTimeout(() => setLogoClicks(0), 1800);
      setLogoClickTimer(timer);
      if (next >= 5) {
        setLogoClicks(0);
        setAdminLoginOpen(true);
      }
      return next;
    });
  }

  /* =========================
     FILTER PROJECTS
  ========================= */

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") {
      return projects;
    }

    return projects.filter(
      (project) =>
        project.category === activeCategory
    );
  }, [projects, activeCategory]);

  /* =========================
     JD MATCH: re-order + highlight
  ========================= */

  function norm(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  }

  function relevantIndex(title: string) {
    if (!jdMatch) return -1;

    const t = norm(title);
    if (t.length < 3) return -1;

    return jdMatch.relevant_projects.findIndex((p) => {
      const r = norm(p.title);
      return r.length >= 3 && (r === t || r.includes(t) || t.includes(r));
    });
  }

  function skillMatched(item: string) {
    if (!jdMatch) return false;

    const n = norm(item);
    if (n.length < 2) return false;

    return jdMatch.matching_skills.some((skill) => {
      const m = norm(skill);
      if (m.length < 2) return false;

      return (
        m === n ||
        (n.length >= 4 && m.includes(n)) ||
        (m.length >= 4 && n.includes(m))
      );
    });
  }

  const shownProjects = useMemo(() => {
    if (!jdMatch) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
      const ia = relevantIndex(a.title);
      const ib = relevantIndex(b.title);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects, jdMatch]);

  const shownStack = useMemo(() => {
    if (!jdMatch) return stack;

    return [...stack].sort(
      (a, b) => Number(skillMatched(b)) - Number(skillMatched(a))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack, jdMatch]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">

      {/* =========================
          BACKGROUND
      ========================= */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-[10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />

        <div className="absolute right-[5%] top-[20%] h-[420px] w-[420px] rounded-full bg-violet-500/[0.07] blur-[130px]" />

        <div className="absolute bottom-[-10%] left-[35%] h-[380px] w-[380px] rounded-full bg-blue-500/[0.05] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#050505]/75 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">

          <button
            type="button"
            onClick={handleLogoAdminClick}
            className="text-sm font-semibold tracking-[-0.02em] text-white"
            aria-label="Home"
          >
            ISHWAR
            <span className="text-cyan-400">
              .
            </span>
          </button>

          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#work"
              className="text-xs text-neutral-500 transition hover:text-white"
            >
              Work
            </a>

            <a
              href="#stack"
              className="text-xs text-neutral-500 transition hover:text-white"
            >
              Stack
            </a>

            <a
              href="#about"
              className="text-xs text-neutral-500 transition hover:text-white"
            >
              About
            </a>

            <a
              href="#contact"
              className="text-xs text-neutral-500 transition hover:text-white"
            >
              Contact
            </a>

            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-500 transition hover:text-white"
            >
              Resume
            </a>

          </div>

          {/* FIXED GITHUB / LINKEDIN */}

          <div className="hidden items-center gap-3 md:flex">

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 p-2.5 text-neutral-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              aria-label="GitHub"
            >
              <GitHubIcon size={16} />
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 p-2.5 text-neutral-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={16} />
            </a>

          </div>

          <button
            onClick={() =>
              setMobileMenu(
                (value) => !value
              )
            }
            className="rounded-full border border-white/10 p-2 text-neutral-300 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>

        </div>

        {/* MOBILE MENU */}

        {mobileMenu && (
          <div className="border-t border-white/[0.06] bg-[#050505]/95 px-5 py-5 md:hidden">

            <div className="flex flex-col gap-5">

              <a
                href="#work"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-sm text-neutral-400"
              >
                Work
              </a>

              <a
                href="#stack"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-sm text-neutral-400"
              >
                Stack
              </a>

              <a
                href="#about"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-sm text-neutral-400"
              >
                About
              </a>

              <a
                href="#contact"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-sm text-neutral-400"
              >
                Contact
              </a>

              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-sm text-neutral-400"
              >
                Resume
              </a>

              <div className="flex gap-3 border-t border-white/[0.06] pt-5">

                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400"
                >
                  <GitHubIcon size={16} />
                  GitHub
                </a>

                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400"
                >
                  <LinkedInIcon size={16} />
                  LinkedIn
                </a>

              </div>

            </div>

          </div>
        )}

      </nav>

      {/* =========================
          JD MATCH BANNER
      ========================= */}

      {jdMatch && (
        <div className="fixed left-0 right-0 top-16 z-40 border-b border-cyan-400/20 bg-[#06141a]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 sm:px-8">
            <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              {jdMatch.match_percent}% match
            </span>

            <p className="min-w-0 flex-1 text-xs text-neutral-300">
              Portfolio is role ke hisaab se re-arrange ho gaya: relevant projects
              aur skills upar highlight hain.
            </p>

            <button
              type="button"
              onClick={() => setJdMatch(null)}
              className="text-xs text-neutral-400 underline-offset-2 transition hover:text-white hover:underline"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* =========================
          HERO
      ========================= */}

      <section
        id="home"
        className="relative mx-auto flex min-h-screen max-w-6xl items-center px-5 pb-20 pt-28 sm:px-8"
      >

        <Hero3D />

        <div className="relative z-10 w-full">

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="mb-7 flex items-center gap-3"
          >

            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />

            <span className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              {profile.availability}
            </span>

          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.08,
            }}
            className="max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-[58px] md:text-[70px] lg:text-[82px]"
          >
            <span className="block">
              Building
            </span>

            <span className="gradient-text block">
              intelligent systems.
            </span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.2,
            }}
            className="mt-7 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base"
          >
            {profile.headline}. I design
            and build AI-powered applications,
            agentic workflows and reliable
            Python backends using modern
            Generative AI technologies.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.28,
            }}
            className="mt-9 flex flex-wrap gap-3"
          >

            <a
              href="#work"
              data-magnetic
              className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              View my work

              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            <a
              href={`mailto:${EMAIL}`}
              data-magnetic
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <Mail size={16} />
              Contact me
            </a>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.34 }}
            className="mt-4"
          >
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-ask-ai", { detail: { tab: "jd" } })
                )
              }
              data-magnetic
              className="rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-5 py-3 text-sm text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-400/10"
            >
              Paste a job description → see how I fit
            </button>
          </motion.div>

          {/* STATS */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.4,
            }}
            className="mt-20 grid max-w-2xl grid-cols-2 gap-y-8 border-t border-white/[0.08] pt-8 sm:grid-cols-4"
          >

            <div>
              <p className="text-2xl font-semibold">
                <CountUp value={projects.length} pad={2} suffix="+" />
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                AI Projects
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold">
                <CountUp value={projects.filter((project) => project.live_url).length} pad={2} suffix="+" />
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Live deployments
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold">
                <CountUp value={stack.length} pad={2} suffix="+" />
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Technologies
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold">
                Open
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Internships &amp; full-time
              </p>
            </div>

          </motion.div>

        </div>

      </section>

      {/* =========================
          WORK
      ========================= */}

      <section
        id="work"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
      >

        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
              Selected work
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <ScrambleText text="Projects that solve problems." />
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              A selection of AI and backend
              systems I have designed and built.
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            {categories.map(
              (category) => (
                <button
                  key={category}
                  onClick={() =>
                    setActiveCategory(
                      category
                    )
                  }
                  className={`rounded-full border px-3.5 py-2 text-xs transition ${
                    activeCategory ===
                    category
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/[0.02] text-neutral-500 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              )
            )}

          </div>

        </div>

        {loading && (
          <div className="mb-6 text-xs text-neutral-600">
            Syncing portfolio...
          </div>
        )}

        {/* PROJECT GRID */}

        <div className="grid gap-5 md:grid-cols-2">

          {shownProjects.map(
            (project, index) => {

              const tags =
                parseTags(project.tags);

              const image =
                imageUrl(
                  project.image_url
                );

              return (
                <motion.article
                  key={project.id}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.15,
                  }}
                  transition={{
                    duration: 0.55,
                    delay:
                      index * 0.05,
                  }}
                  className={`spotlight group overflow-hidden rounded-2xl border bg-white/[0.025] transition hover:border-white/[0.16] ${
                    relevantIndex(project.title) >= 0
                      ? "border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                      : "border-white/[0.08]"
                  }`}
                >

                  {/* PROJECT IMAGE */}

                  {image && (
                    <div className="relative overflow-hidden border-b border-white/[0.06]">

                      <img
                        src={image}
                        alt={project.title}
                        className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent" />

                    </div>
                  )}

                  <div className="p-6 sm:p-7">

                    {jdMatch && relevantIndex(project.title) >= 0 && (
                      <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-[11px] leading-5 text-cyan-200">
                        <span className="font-semibold">
                          Relevant for this role:
                        </span>{" "}
                        {
                          jdMatch.relevant_projects[
                            relevantIndex(project.title)
                          ].reason
                        }
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-[11px] uppercase tracking-[0.16em] text-cyan-400">
                        {project.category}
                      </span>

                      {project.featured && (
                        <span className="flex items-center gap-1 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] text-cyan-300">
                          <CheckCircle2
                            size={11}
                          />
                          Featured
                        </span>
                      )}

                    </div>

                    <h3 className="mt-5 text-xl font-medium tracking-tight text-white">
                      {project.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-neutral-500">
                      {project.description}
                    </p>

                    {/* TAGS */}

                    {tags.length >
                      0 && (
                      <div className="mt-5 flex flex-wrap gap-2">

                        {tags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-neutral-500"
                            >
                              {tag}
                            </span>
                          )
                        )}

                      </div>
                    )}

                    {/* PROJECT LINKS */}

                    <div className="mt-7 flex items-center gap-5">

                      {project.live_url && (
                        <a
                          href={
                            project.live_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-white transition hover:text-cyan-400"
                        >
                          Live demo
                          <ArrowUpRight
                            size={14}
                          />
                        </a>
                      )}

                      {project.github_url && (
                        <a
                          href={
                            project.github_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-neutral-500 transition hover:text-white"
                        >
                          <GitHubIcon size={14} />
                          Source
                        </a>
                      )}

                    </div>

                  </div>

                </motion.article>
              );
            }
          )}

        </div>

        {shownProjects.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-neutral-600">
            No projects found in this
            category.
          </div>
        )}

      </section>

      <ProfileSection
        name={profile.name}
        headline={profile.headline}
        bio={profile.bio}
        availability={profile.availability}
        resumeUrl={resumeUrl !== "/resume.pdf" ? resumeUrl : undefined}
      />

      <GithubActivity username="ishwardhakad779-a11y" />

      <AgentWorkflows />

      <LiveAgent />

      <DemoStatus />

      <ArchitectureDiagram />

      <HeroTerminal
        name={profile.name}
        headline={profile.headline}
        bio={profile.bio}
        availability={profile.availability}
        projects={projects}
        stack={stack}
        resumeUrl={resumeUrl !== "/resume.pdf" ? resumeUrl : undefined}
      />

      <IncidentSimulator />

      {/* =========================
          STACK
      ========================= */}

      <section
        id="stack"
        className="scroll-mt-24 border-y border-white/[0.06] bg-white/[0.015]"
      >

        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">

          <div className="max-w-2xl">

            <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
              Technology
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <ScrambleText text="Tools I build with." />
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-500">
              A practical stack focused on
              AI engineering, backend
              development, APIs, databases
              and deployment.
            </p>

          </div>

          <div className="mt-10 flex flex-wrap gap-3">

            {shownStack.map(
              (item, index) => (
                <motion.div
                  key={`${item}-${index}`}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.3,
                    delay:
                      index * 0.025,
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    skillMatched(item)
                      ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                      : "border-white/[0.08] bg-white/[0.025] text-neutral-300 hover:border-cyan-400/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {item}
                </motion.div>
              )
            )}

          </div>

        </div>

      </section>

      {/* =========================
          ABOUT
      ========================= */}

      <section
        id="about"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8"
      >

        <div className="grid gap-14 md:grid-cols-[0.8fr_1.2fr] md:items-center">

          <div>

            <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
              About me
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <ScrambleText text="Building with curiosity." />
            </h2>

          </div>

          <div>

            <p className="text-base leading-8 text-neutral-400">
              {profile.bio}
            </p>

            <p className="mt-6 text-sm leading-7 text-neutral-600">
              My focus is on turning AI
              capabilities into useful
              applications with clean APIs,
              reliable backend architecture
              and intelligent agent workflows.
            </p>

            {/* FIXED SOCIAL LINKS */}

            <div className="mt-8 flex flex-wrap gap-3">

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-neutral-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <GitHubIcon size={15} />
                GitHub
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-neutral-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                <LinkedInIcon size={15} />
                LinkedIn
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          CONTACT
      ========================= */}

      <section
        id="contact"
        className="scroll-mt-24 border-t border-white/[0.06]"
      >

        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center sm:px-12">

            <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-[100px]" />

            <div className="relative">

              <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
                Get in touch
              </p>

              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                <ScrambleText text="Have an idea worth building?" />
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-500">
                Let&apos;s talk about AI
                systems, backend engineering,
                automation or your next
                project.
              </p>

              <a
                href={`mailto:${EMAIL}`}
                data-magnetic
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-200"
              >
                <Mail size={16} />
                {EMAIL}
              </a>

            </div>

          </div>

        </div>

      </section>

      {adminLoginOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 px-5 backdrop-blur-md">
          <form onSubmit={submitAdminLogin} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Private access</p>
            <h2 className="mt-2 text-xl font-semibold">Portfolio Admin</h2>
            <p className="mt-2 text-xs leading-5 text-neutral-600">Enter your existing admin credentials.</p>
            <div className="mt-5 grid gap-3">
              <input value={adminUsername} onChange={(e)=>setAdminUsername(e.target.value)} placeholder="Username" autoComplete="username" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"/>
              <input value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Password" type="password" autoComplete="current-password" className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"/>
              {adminError && <p className="text-xs text-red-300">{adminError}</p>}
              <button type="submit" className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">Login</button>
              <button type="button" onClick={()=>setAdminLoginOpen(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-neutral-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {adminOpen && <InlineAdminPanel onClose={()=>setAdminOpen(false)} />}

      {!adminOpen && resumeUrl !== "/resume.pdf" && (
        <RecruiterBar
          resumeUrl={resumeUrl}
          email={EMAIL}
          linkedin={LINKEDIN_URL}
        />
      )}

      {!adminOpen && <AskAI />}

      <MagneticEffect />

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="border-t border-white/[0.06]">

        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center">

          <p className="text-xs text-neutral-700">
            © {currentYear ?? 2026}{" "}
            {profile.name ||
              "Ishwar Dhakad"}
            . Built with Next.js.
          </p>

          <div className="flex items-center gap-4">

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 transition hover:text-white"
              aria-label="GitHub"
            >
              <GitHubIcon size={17} />
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 transition hover:text-white"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={17} />
            </a>

            <a
              href={`mailto:${EMAIL}`}
              className="text-neutral-600 transition hover:text-white"
              aria-label="Email"
            >
              <Mail size={17} />
            </a>

          </div>

        </div>

      </footer>

    </main>
  );
}