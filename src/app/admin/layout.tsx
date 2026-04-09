import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth, signOut } from '@/lib/auth';

type NavItem = { href: string; label: string; icon: string };

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  {
    href: '/admin/shops',
    label: 'Shops',
    icon: 'M4 7h16M4 12h16M4 17h10',
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: 'M9 5h6a2 2 0 012 2v12l-5-3-5 3V7a2 2 0 012-2z',
  },
  {
    href: '/admin/incidents',
    label: 'Incidents',
    icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  },
  {
    href: '/admin/payouts',
    label: 'Payouts',
    icon: 'M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z',
  },
  {
    href: '/admin/onboard',
    label: 'Onboard',
    icon: 'M12 4v16m8-8H4',
  },
  {
    href: '/admin/kpi',
    label: 'KPI',
    icon: 'M3 3v18h18M7 15l4-4 4 4 5-5',
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Figure out current path so we don't redirect on /admin/login itself.
  // Middleware sets x-pathname. In dev without subdomain middleware,
  // we fall back to referer parsing.
  const h = await headers();
  const pathname =
    h.get('x-pathname') ||
    h.get('x-invoke-path') ||
    h.get('next-url') ||
    (h.get('referer') ? new URL(h.get('referer')!).pathname : '');

  const isLoginRoute = pathname.includes('/admin/login');

  if (!session?.user && !isLoginRoute) {
    redirect('/admin/login');
  }

  // On the login page we render a bare shell
  if (isLoginRoute || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-sand-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 shrink-0 bg-[#2b1d10] text-sand-100 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/admin" className="block">
            <p className="font-display text-2xl leading-tight">
              Maybe<span className="text-ochre-400">Tomorrow</span>
            </p>
            <p className="text-[11px] tracking-widest uppercase text-sand-200/50 mt-1">
              Admin Console
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sand-100/80 hover:bg-white/5 hover:text-ochre-400 transition"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-ochre-500 flex items-center justify-center font-display text-sm">
              {(session.user.name || 'A').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name || 'Admin'}
              </p>
              {session.user.email && (
                <p className="text-[11px] text-sand-200/50 truncate">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <button
              type="submit"
              className="w-full text-left text-xs text-sand-200/60 hover:text-ochre-400 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 min-w-0 bg-white">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
