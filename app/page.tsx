import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
        Human Writer Pro
      </h1>
      <div className="flex gap-4">
        <Button>Primary Action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </main>
  );
}
