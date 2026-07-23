import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/first-access', '/api/auth/login'];
const RT_ONLY_PATHS = ['/employees', '/approvals', '/audit', '/settings', '/api/employees', '/api/schedule/generate'];

function parseJwtPayload(token: string) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sigep_token')?.value;
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('sigep_token');
    return response;
  }

  if (RT_ONLY_PATHS.some((p) => pathname.startsWith(p)) && payload.role !== 'RT') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname !== '/auth/first-access') {
    const cookieFirstAccess = request.cookies.get('sigep_first_access')?.value;
    if (cookieFirstAccess === 'true') {
      return NextResponse.redirect(new URL('/auth/first-access', request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|api/push|.*\.png|.*\.jpg|.*\.jpeg|.*\.gif|.*\.svg|.*\.ico|.*\.webp).*)',
  ],
};