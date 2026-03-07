import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_PREFIXES = [
  '/visualiser',
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAllowed) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/visualiser/designer';
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
