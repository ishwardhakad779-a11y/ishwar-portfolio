import { NextRequest, NextResponse } from "next/server";

// Admin write calls (POST / PUT / DELETE) yahin se guzarte hain.
// 1) admin_session cookie verify hoti hai (middleware wali logic jaisi)
// 2) phir request backend ko X-Admin-Key ke saath forward hoti hai.
// ADMIN_API_KEY sirf server pe rehti hai, browser tak kabhi nahi pahunchti.

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function verifyToken(token: string, username: string, secret: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [tokenUsername, timestamp, tokenSecret] = parts;
    if (tokenUsername.toLowerCase() !== username.toLowerCase()) return false;
    if (tokenSecret !== secret) return false;

    const tokenTime = Number(timestamp);
    if (!Number.isFinite(tokenTime)) return false;

    const age = Date.now() - tokenTime;
    return age >= 0 && age <= 1000 * 60 * 60 * 24;
  } catch {
    return false;
  }
}

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const username = process.env.ADMIN_USERNAME;
  const secret = process.env.ADMIN_SECRET;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!username || !secret || !adminKey) {
    return NextResponse.json(
      { detail: "Admin authentication is not configured." },
      { status: 500 }
    );
  }

  const token = request.cookies.get("admin_session")?.value;

  if (!token || !verifyToken(token, username, secret)) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const target = `${API.replace(/\/$/, "")}/${path
    .map(encodeURIComponent)
    .join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = { "x-admin-key": adminKey };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}

export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
