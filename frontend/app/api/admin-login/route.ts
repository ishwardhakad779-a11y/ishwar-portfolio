import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    const expectedUsername = process.env.ADMIN_USERNAME?.trim();
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SECRET;

    if (!expectedUsername || !expectedPassword || !secret) {
      return NextResponse.json(
        { message: "Admin authentication is not configured." },
        { status: 500 }
      );
    }

    if (
      username.toLowerCase() !== expectedUsername.toLowerCase() ||
      password !== expectedPassword
    ) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const timestamp = Date.now().toString();

    const token = Buffer.from(
      `${username}:${timestamp}:${secret}`
    ).toString("base64url");

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { message: "Invalid request." },
      { status: 400 }
    );
  }
}