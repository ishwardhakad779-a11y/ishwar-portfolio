import { ImageResponse } from "next/og";

// Link preview card (LinkedIn, WhatsApp, Twitter, Slack).
// Put this file at: frontend/app/opengraph-image.tsx

export const runtime = "edge";
export const alt = "Ishwar Dhakad | GenAI & Agentic AI Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const chips = ["LangGraph", "RAG", "FastAPI", "Next.js"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#050505",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(34,211,238,0.30), transparent 45%), radial-gradient(circle at 10% 95%, rgba(167,139,250,0.24), transparent 45%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#34d399",
              marginRight: 14,
            }}
          />
          <div style={{ display: "flex", fontSize: 28, color: "#6ee7b7" }}>
            Open to work
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            Ishwar Dhakad
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              marginTop: 12,
              color: "#67e8f9",
            }}
          >
            GenAI &amp; Agentic AI Developer
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              marginTop: 18,
              color: "#a3a3a3",
            }}
          >
            Indore, India · Live agents you can actually run
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "10px 22px",
                marginRight: 14,
                fontSize: 26,
                color: "#e5e5e5",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}