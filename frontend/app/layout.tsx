import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import CursorGlow from "./components/CursorGlow";
import Tracker from "./components/Tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings ke liye
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const TITLE = "Ishwar Dhakad | Agentic AI & Python Backend Engineer";
const DESCRIPTION =
  "Portfolio of Ishwar Dhakad: AI agents, LangGraph, RAG and FastAPI backends. Try the live agent demo and see how I fit your job description.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CursorGlow />
        <Tracker />
        {children}
      </body>
    </html>
  );
}
