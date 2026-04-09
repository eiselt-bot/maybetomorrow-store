import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const metadata: Metadata = {
  title: {
    default: 'MaybeTomorrow.store — Handcrafted on Diani Beach',
    template: '%s · MaybeTomorrow.store',
  },
  description:
    'A cooperative of beach artisans in Diani, Kenya. Discover handcrafted shoes, beads, kangas, and coconut treats — delivered to your doorstep.',
  metadataBase: new URL('https://maybetomorrow.store'),
  openGraph: {
    title: 'MaybeTomorrow.store',
    description:
      'Handcrafted on Diani Beach — delivered to your doorstep in Kenya.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={inter.variable + ' ' + fraunces.variable + ' h-full antialiased'}
    >
      <body className="min-h-full flex flex-col bg-sand-50 text-foreground">
        {children}
      </body>
    </html>
  );
}
