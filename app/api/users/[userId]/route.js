import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/users";

import { cookies } from "next/headers";

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

// ────────────────────────────────
// GET user info by ID (for dashboard/profile view)
// ────────────────────────────────
export async function GET(req, { params }) {
  try {
    const { userId } = params;
    await dbConnect();

    const user = await User.findById(userId, {
      _id: 1,
      email: 1,
      username: 1,
      firstName: 1,
      lastName: 1,
      role: 1,
      coins: 1,
      createdAt: 1
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// ────────────────────────────────
// PUT update user info (protected, auth via cookie)
// ────────────────────────────────
export async function PUT(req, { params }) {
  try {
    const { userId } = params;
    const body = await req.json();
    await dbConnect();

    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth'); // replace with your actual auth cookie key

    if (!authCookie?.value) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let currentUser;
    try {
      currentUser = JSON.parse(decodeURIComponent(authCookie.value));
    } catch (error) {
      return NextResponse.json({ error: "Invalid authentication format" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.role && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change user roles" }, { status: 403 });
    }

    if (body.username && body.username !== user.username) {
      const existing = await User.findOne({ username: body.username });
      if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }
      user.username = body.username;
    }

    if (body.email && body.email !== user.email) {
      const existing = await User.findOne({ email: body.email });
      if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
      user.email = body.email;
    }

    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.imageUrl !== undefined) user.imageUrl = body.imageUrl;
    if (body.role) user.role = body.role;
    if (typeof body.coins === 'number') user.coins = body.coins;

    if (body.password) {
      if (!isStrongPassword(body.password)) {
        return NextResponse.json({ error: "Password is not strong enough" }, { status: 400 });
      }
      user.password = body.password; // Store as plain text for demo (NOT secure for production)
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
