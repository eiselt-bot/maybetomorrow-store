import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 mt-hero-grain">
      <div className="max-w-lg w-full text-center">
        <p className="font-display text-[clamp(4rem,12vw,8rem)] leading-none text-ochre-500">
          404
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-teal-900 mt-2">
          This shop isn't here yet
        </h1>
        <p className="mt-4 text-teal-900/70">
          Maybe tomorrow. In the meantime, head back to the beach and browse the
          artisans we already have.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-teal-900 px-6 py-3 text-sand-50 font-medium hover:bg-teal-700 transition"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
