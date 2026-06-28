import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Localhost developer bypass (allows developers to test both layouts locally)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // Secret Bypass Query Param or Cookie for testing on main domain
  const hasBypassParam = url.searchParams.get('bypassAdmin') === 'true';
  const hasBypassCookie = req.cookies.get('prepai_admin_bypass')?.value === 'true';

  // If user wants to disable the bypass explicitly
  if (url.searchParams.get('bypassAdmin') === 'false') {
    const response = NextResponse.next();
    response.cookies.delete('prepai_admin_bypass');
    return response;
  }

  // If bypass is active, let them access /admin anywhere!
  if (url.pathname.startsWith('/admin')) {
    if (hasBypassParam || hasBypassCookie) {
      const response = NextResponse.next();
      if (hasBypassParam && !hasBypassCookie) {
        response.cookies.set('prepai_admin_bypass', 'true', { path: '/' });
      }
      return response;
    }
  }

  // Auto-detect if request is hitting the Admin subdomain
  // Matches "admin.prepai.in", "upsc-admin.vercel.app", "admin-upsc.vercel.app", etc.
  const isAdminDomain = hostname.toLowerCase().includes('admin');

  if (isAdminDomain) {
    // 1. Redirect root "/" of admin subdomain directly to /admin
    if (url.pathname === '/') {
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }

    // 2. Block administrative domain from opening student pages
    const studentRoutes = [
      '/dashboard',
      '/lesson',
      '/quiz',
      '/challenge',
      '/leaderboard',
      '/profile',
      '/books',
      '/flashcards'
    ];
    if (studentRoutes.some(route => url.pathname.startsWith(route))) {
      url.pathname = '/404';
      return NextResponse.rewrite(url);
    }
  } else {
    // This is the main student app domain (e.g. app.prepai.in, prepai.in, etc.)
    
    // Block access to the admin panels on student domain
    if (url.pathname.startsWith('/admin')) {
      url.pathname = '/404';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Intercept all paths except static files, images, service workers, and APIs
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};
