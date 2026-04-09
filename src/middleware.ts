import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const APEX_DOMAIN = process.env.APEX_DOMAIN || 'maybetomorrow.store';
const RESERVED = new Set(['www', 'api', '_next', 'mahelya']);

function withPathnameHeader(res: NextResponse, pathname: string): NextResponse {
  res.headers.set('x-pathname', pathname);
  return res;
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const url = req.nextUrl.clone();
  const originalPath = url.pathname;

  // Strip port (localhost:3003) for dev
  const hostname = host.split(':')[0];

  // Compute subdomain
  let subdomain = '';
  if (hostname.endsWith('.' + APEX_DOMAIN)) {
    subdomain = hostname.replace('.' + APEX_DOMAIN, '');
  } else if (hostname === APEX_DOMAIN) {
    subdomain = '';
  } else {
    // Localhost / IP / dev: treat as apex. Devs use path-based access.
    subdomain = '';
  }

  // Apex or www → landing (no rewrite, let the app handle /)
  if (!subdomain || subdomain === 'www') {
    return withPathnameHeader(NextResponse.next(), originalPath);
  }

  // 'admin' subdomain → rewrite to /admin/*
  if (subdomain === 'admin') {
    const newPath = '/admin' + (url.pathname === '/' ? '' : url.pathname);
    url.pathname = newPath;
    return withPathnameHeader(NextResponse.rewrite(url), newPath);
  }

  if (RESERVED.has(subdomain)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Shop subdomain → /shop/[slug]/*
  const shopPath = '/shop/' + subdomain + url.pathname;
  url.pathname = shopPath;
  return withPathnameHeader(NextResponse.rewrite(url), shopPath);
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|icons/|_uploads/|api/public/).*)'],
};
