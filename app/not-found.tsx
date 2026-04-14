import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8 bg-background text-foreground">
      <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
        Not found.
      </h1>
      <p className="font-body text-base text-secondary max-w-sm text-center">
        The page you requested does not exist at this address.
      </p>
      <Link
        href="/"
        className="font-mono text-xs tracking-[0.08em] uppercase border border-primary px-6 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        Return home
      </Link>
    </main>
  );
}
