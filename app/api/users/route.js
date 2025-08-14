import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/users";
import { serialize } from "cookie";
import NotificationService from "@/lib/notificationService";

// Helper: strong password check
function isStrongPassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
} 

export async function POST(req) {
  try {
    const { username, email, password, firstName, lastName, referralCode } = await req.json();
    
    // Store password as plain text for demo purposes
    await connectDB();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: `Username '${username}' is already taken. Please choose a different username.` },
        { status: 400 }
      );
    }
    
    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: `Email '${email}' is already registered. Please use a different email or try logging in.` },
        { status: 400 }
      );
    }


    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const user = await User.create({
      username,
      email,
      password, // Store as plain text for demo
      firstName,
      lastName,
      referredBy,
    });

    if (referredBy) {
      // Credit both the new user and the referrer with 5 coins
      await User.findByIdAndUpdate(user._id, { $inc: { coins: 5 } });
      await User.findByIdAndUpdate(referredBy, { $inc: { coins: 5 } });
    }


    
    // Auto sign-in after successful signup
    // Set cookie for auto login
    const cookie = serialize('auth', user._id.toString(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    // Send welcome notification
    try {
      await NotificationService.sendCustomNotification(
        user.email,
        'Welcome to TurraniX! 🎮',
        `Account created successfully! Welcome ${user.firstName || user.username}!`
      );
    } catch (notificationError) {
      console.error('Failed to send welcome notification:', notificationError);
    }
    
    // Return user data (excluding password) with cookie set
    const { password: _, ...userDoc } = user.toObject();
    return new NextResponse(JSON.stringify({ 
      message: "User registered and logged in", 
      user: userDoc 
    }), {
      status: 201,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  // Login
  try {
    await connectDB();
    const body = await request.json();
    const { identifier, password } = body; // identifier = username or email
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Find user by username or email
    const user = await User.findOne({ $or: [ { username: identifier }, { email: identifier } ] });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    // Check password (plain text comparison for demo)
    if (password !== user.password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Send login success notification
    try {
      await NotificationService.sendCustomNotification(
        user.email,
        'Welcome Back! 🎮',
        `Successfully logged in to your account. Ready to play?`
      );
    } catch (notificationError) {
      console.error('Failed to send login notification:', notificationError);
      // Don't fail the login if notification fails
    }
    
    // Set cookie (simple session, for demo)
    const cookie = serialize('auth', user._id.toString(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    // Return user doc (excluding password)
    const { password: _, ...userDoc } = user.toObject();
    return new NextResponse(JSON.stringify(userDoc), {
      status: 200,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}

// GET: fetch user by id, username, or email (for client-side use)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    
    await connectDB();
    let user;
    
    if (id) {
      user = await User.findById(id);
    } else if (username) {
      user = await User.findOne({ username });
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      // Return all users for admin, with optional role filtering
      let query = {};
      if (role) {
        query.role = role;
      }
      const users = await User.find(query);
      const usersNoPassword = users.map(u => {
        const { password, ...userDoc } = u.toObject();
        return userDoc;
      });
      return NextResponse.json(usersNoPassword);
    }
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { password, ...userDoc } = user.toObject();
    return NextResponse.json(userDoc);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}

export async function GET_ME(request) {
  try {
    await connectDB();
    // Get user id from cookie
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/auth=([^;]+)/);
    if (!match) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = match[1];
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { password, ...userDoc } = user.toObject();
    return NextResponse.json(userDoc);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}