import { NextRequest, NextResponse } from "next/server";

function verifyToken(
  token: string,
  username: string,
  secret: string
) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");

    const parts = decoded.split(":");

    if (parts.length !== 3) {
      return false;
    }

    const [tokenUsername, timestamp, tokenSecret] = parts;

    if (tokenUsername.toLowerCase() !== username.toLowerCase()) {
      return false;
    }

    if (tokenSecret !== secret) {
      return false;
    }

    const tokenTime = Number(timestamp);

    if (!Number.isFinite(tokenTime)) {
      return false;
    }

    const age = Date.now() - tokenTime;

    if (age < 0 || age > 1000 * 60 * 60 * 24) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    !pathname.startsWith("/admin") ||
    pathname.startsWith("/admin/login")
  ) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const secret = process.env.ADMIN_SECRET;

  if (!username || !secret) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  const token = request.cookies.get("admin_session")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  const valid = verifyToken(token, username, secret);

  if (!valid) {
    const response = NextResponse.redirect(
      new URL("/admin/login", request.url)
    );

    response.cookies.delete("admin_session");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};