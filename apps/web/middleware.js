import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === '/login' || pathname === '/register';
  const hasAuthToken = request.cookies.has('accessToken');

  // If trying to access protected route without token, redirect to login
  if (!isPublicPath && !hasAuthToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in user tries to access auth pages, redirect to dashboard
  if (isPublicPath && hasAuthToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
