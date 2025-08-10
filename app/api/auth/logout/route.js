import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Create response with cleared cookies
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear all authentication cookies
    response.cookies.delete('token');
    response.cookies.delete('session');
    response.cookies.delete('auth');
    response.cookies.delete('user');
    response.cookies.delete('userId');
    response.cookies.delete('email');
    response.cookies.delete('username');
    
    // Clear any other potential auth cookies
    response.cookies.delete('jwt');
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
} 