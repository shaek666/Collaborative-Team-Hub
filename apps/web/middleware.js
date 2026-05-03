import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const isPublicPath = pathname === '/login' || pathname === '/register';

  // We can't check the accessToken cookie here because it's set on the API domain (cross-domain).
  // Auth redirection for logged-in users is handled client-side via fetchMe + router.
  if (!isPublicPath) {
    // For protected routes, we allow the request through.
    // The client-side auth store will handle redirecting unauthenticated users.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
