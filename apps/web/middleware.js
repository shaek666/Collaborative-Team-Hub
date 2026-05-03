import { NextResponse } from 'next/server';

export function middleware(request) {
  // Auth checks are handled client-side via useAuthStore.fetchMe()
  // because httpOnly cookies are set on the API domain (api-production-4177.up.railway.app)
  // and aren't readable server-side on the web domain (web-production-bbe80.up.railway.app).
  // The client-side layout.js fetchMe() call sends the cookie correctly via withCredentials: true.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
