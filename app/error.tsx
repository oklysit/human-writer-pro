"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8 bg-background text-foreground">
      <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
        Something broke.
      </h1>
      <p className="font-body text-base text-secondary max-w-sm text-center">
        You can retry below, or return to the workspace.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
