import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/profile',
  '/wallet', 
  '/notifications',
  '/admin',
  '/manager',
  '/chatbot'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/matches',
  '/events',
  '/settings',
  '/privacy',
  '/terms'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Get the auth cookie
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = !!authCookie?.value;
  
  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is authenticated and trying to access login page, redirect to home
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 