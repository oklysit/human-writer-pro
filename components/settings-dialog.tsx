"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const apiKey = useSessionStore((s) => s.apiKey)
  const setApiKey = useSessionStore((s) => s.setApiKey)

  const [value, setValue] = React.useState<string>("")
  const [revealed, setRevealed] = React.useState(false)

  // Seed input from store each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setValue(apiKey ?? "")
      setRevealed(false)
    }
  }, [open, apiKey])

  function handleSave() {
    const trimmed = value.trim()
    setApiKey(trimmed.length > 0 ? trimmed : null)
    onOpenChange(false)
  }

  function handleClear() {
    setApiKey(null)
    setValue("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Your Anthropic API key stays in this browser. We never send it to a
            server.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Input label */}
          <label
            htmlFor="api-key-input"
            className="label-caps text-foreground"
          >
            Anthropic API Key
          </label>

          {/* Input row with show/hide toggle */}
          <div className="relative flex items-center">
            <input
              id="api-key-input"
              type={revealed ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-ant-api03-..."
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "w-full rounded-sm border border-border bg-background px-3 py-2 pr-10",
                "font-mono text-sm text-foreground placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide API key" : "Show API key"}
              className={cn(
                "absolute right-3 text-muted-foreground transition-opacity",
                "hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
              )}
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          {/* Disclosure block */}
          <div className="rounded-sm border border-border bg-muted/40 px-3 py-3">
            <p className="label-caps text-muted-foreground mb-1.5">
              BYO-Key Architecture
            </p>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              This app calls Anthropic directly from your browser using the{" "}
              <code className="font-mono">@anthropic-ai/sdk</code> with{" "}
              <code className="font-mono">dangerouslyAllowBrowser: true</code>.
              The trade-off is straightforward: your key is stored in this
              browser&apos;s localStorage, which means it is only as secure as
              this machine. We chose this to keep the product fully serverless
              and to avoid ever holding user credentials. A thin backend proxy is
              the conventional path for production — this is a deliberate v1
              choice, not a permanent architecture.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
