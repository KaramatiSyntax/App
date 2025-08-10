// app/api/users/me/route.js
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/users';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectDB();

    // Get user id from cookie
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/auth=([^;]+)/);
    
    if (!match) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = match[1];
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    
    // Get user id from cookie
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/auth=([^;]+)/);
    
    if (!match) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = match[1];
    const body = await req.json();
    const { firstName, lastName, username, imageUrl } = body;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        username,
        image: imageUrl, // Note: using 'image' to match the User model
        updatedAt: new Date(),
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
