"use client";

import { useSessionStore } from "@/lib/store";
import { MODES } from "@/lib/prompts/modes";
import type { Mode } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModeSelectorProps {
  className?: string;
}

export function ModeSelector({ className }: ModeSelectorProps) {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <div className={className}>
      <label
        htmlFor="mode-selector"
        className="label-caps text-muted-foreground block mb-2"
      >
        Writing Mode
      </label>
      <Select
        value={mode ?? ""}
        onValueChange={(value) => setMode(value as Mode)}
      >
        <SelectTrigger id="mode-selector" className="w-full">
          <SelectValue placeholder="Choose mode…" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MODES).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
