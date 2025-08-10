import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/users";

export async function POST(request) {
  try {
    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds array required" }, { status: 400 });
    }
    await dbConnect();
    const users = await User.find({ _id: { $in: userIds } }, { email: 1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 