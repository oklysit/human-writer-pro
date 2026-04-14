# Post-MVP Backlog

Bugs and UX issues surfaced during live-app smoke testing that do not block
the MVP submission but should be addressed in the next iteration.

Captured 2026-04-14 during Day 4 Cluster 2 smoke test.

---

## 1. API key validation error not displayed inline in Settings

**Symptom.** User accidentally pasted the Vercel URL instead of the API
key. Settings dialog accepted the save. Interview auto-kickoff tried to
construct the Anthropic client, hit the `startsWith("sk-ant-")` check at
`lib/anthropic-client.ts:4`, threw. Error landed in the global error store
via `setError(msg)` in `components/interview-panel.tsx:126`, but no inline
error surface rendered. User saw nothing.

**Fix sketch.** In `components/settings-dialog.tsx`, add inline validation
on the save action: `if (!value.startsWith("sk-ant-")) return early with
inline error`. Display the error under the textarea in `text-destructive`.
Lives entirely within the dialog; no store plumbing needed.

**Severity.** Medium — silent failure is worst-case UX. Cheap fix.

---

## 2. Textarea does not auto-scroll during voice input

**Symptom.** While dictating, the transcript fills the textarea faster
than its visible area. Scrollbar extends, but the view does not follow the
cursor — user sees their older words, not the current ones being spoken.

**Root cause.** `components/interview-panel.tsx` line 363-375 renders a
`<Textarea rows={3} resize-none>`. When content overflows, the textarea
scrolls internally, but nothing updates `scrollTop`. Voice input appends
to `inputValue` via the effect at lines 62-70, which triggers a re-render
but does not reset scroll position.

**Fix sketch.**
```tsx
const textareaRef = React.useRef<HTMLTextAreaElement>(null);
// ... on the <Textarea>:
<Textarea ref={textareaRef} ... />

React.useEffect(() => {
  if (voice.recording && textareaRef.current) {
    textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
  }
}, [voice.recording, inputValue]);
```

`components/ui/textarea.tsx` already forwards refs. Gate on `voice.recording`
so normal typing UX is unaffected.

**Severity.** Medium for text demo, **HIGH for Loom credibility** — voice
input is the product's core pitch and this bug is visible in any dictated
demo.

---

## 3. Voice recording state leaks across turn submission

**Symptom.** When the user clicks Next without stopping voice recording,
the prior answer's text persists in the textarea after the second question
appears.

**Root cause.** `handleSubmit` at `components/interview-panel.tsx:143-194`
calls `setInputValue("")` at line 163 to clear the textarea. But the voice
recording continues. The effect at lines 62-70 fires on the next
interim/final transcript change and sets `inputValue` back to
`baseInputRef.current + separator + finalTranscript + interimTranscript`.
`baseInputRef` still holds the pre-submit content, so the old text comes
back.

**Related issue.** Clicking the mic button again (to record for the second
answer) calls `voice.start()`, which snapshots the current (stale) textarea
value into `baseInputRef` at lines 55-57. New speech is then appended to
the stale text rather than replacing it.

**Fix sketch.** `handleSubmit` should:
1. Call `voice.stop()` if `voice.recording` is true, BEFORE clearing input
2. Reset `baseInputRef.current = ""` after clearing

Alternative: wire the recording-to-input plumbing through a dedicated
"voice session" concept so turn submission resets the session.

**Severity.** Medium-high — awkward UX that breaks trust in the voice flow,
especially in a live demo.

---

## 4. No terminal state at 100% coverage

**Symptom.** Reaching 100% coverage produces no "interview complete" signal.
The `Ready to assemble.` label at `components/interview-panel.tsx:267-270`
renders the same at 60% and 100%. The input area remains active, the next
question keeps generating, and the user has no clear cue that they are done.

**Root cause.** The readiness gate is binary (`isReady = coverageScore >= 0.6
&& wordCount >= 150`). Once crossed, the UI does not differentiate "you
could stop here" from "you are at the ceiling, stop now."

**Fix sketch.** Differentiate at 100%:
- Swap the "Ready to assemble." label to "Interview complete — click
  Assemble →" with a visual arrow or accent treatment
- Optionally disable the Send button once coverage hits 100%, or keep it
  enabled with a secondary-muted treatment for users who want to add more
- Consider a one-time callout (dismissable) the first time the user hits
  100% so it does not feel anticlimactic

**Severity.** Medium — the pushback interview is supposed to feel like a
conversation with a clear ending. No ending breaks that metaphor.

---

## 5. Drop cap on assembled output feels pretentious for cover letters

**Symptom.** First paragraph of the assembled piece renders with a large
decorative capital letter (drop cap). Two concerns:
1. Cover letters do not conventionally have titles or decorative
   typographic treatments — the drop cap contradicts the genre
2. Aesthetically, multiple sessions have now flagged it as reading
   "pretentious" rather than editorial

**Root cause.** Preview panel applies a drop cap to the first paragraph
of rendered markdown (Tailwind `first-letter:` pseudo-element or similar
in `components/preview-panel.tsx` or the drop-cap CSS block).

**Fix sketch.** Either remove the drop cap entirely, or gate it per mode
(essay / blog / free-form: yes; cover-letter / email: no). Simplest is to
remove.

**Severity.** Medium — demo optics matter for a writing product.

---

## 6. Edit chat does not fire on text selection

**Symptom.** Highlighting text in the preview panel produces no edit chat
UI. No inline button, no side panel, no interview question.

**Root cause.** Unknown without investigation. Possibilities: the selection
event listener is not wired; the trigger requires a specific action (e.g.
a button that is not visible); or the event wiring broke during the Task
16 / Task 17 merge.

**Fix sketch.** Investigate `components/preview-panel.tsx` (or wherever
the edit-chat trigger lives). Confirm the Selection API event handler is
attached and that the `useEditChat` hook (or equivalent) is receiving the
selection.

**Severity.** HIGH — this is the load-bearing UX differentiator described
in `process/decisions.md` (adversarial-to-Socratic edit chat). A broken
edit chat defeats the product's "interrogate first, then write" claim.

---

## 7. Edit chat UX redesign — highlight-first, voice-first

**User's preferred workflow.**
1. User highlights any length of text (word / sentence / paragraph) in
   the preview panel
2. Highlighted text **stays highlighted** while they interact
3. An inline "Edit" button appears near the selection (tooltip-style,
   anchored to the highlight) — NOT a global button elsewhere
4. Clicking Edit auto-activates the mic and shows a prompt like "What
   do you want to change?"
5. User states their desired change in their own words (verbatim capture)
6. The AI makes the edit. If it needs more context, THEN it asks
   questions (follow-up Socratic cycle), but only after the user has
   stated their request first

**Rationale.** Highlighting + clicking Edit is a strong signal the user
already knows what they want. Asking them a question first before hearing
their intent flips the interaction backward — the user has to prove they
understand their own edit before they can describe it. The fix: accept
the user's stated change first, use the Socratic interview only if the
change as-stated is ambiguous.

**Fix sketch.**
- Selection UI: capture the `Selection` range, render an inline button
  anchored to the range's bounding rect (portal to overlay layer, use
  `range.getBoundingClientRect()`)
- Preserve selection during interaction: either keep the native selection
  alive (tricky across focus transitions) or save the range object and
  re-apply on confirm
- Voice-first flow: on Edit click, open a prompt panel with the mic
  already armed; user can speak or type
- Two-call cycle: first LLM call takes user's request + the highlighted
  text + surrounding context → returns either (a) a rewritten version or
  (b) one clarifying question. If (b), second call takes user's answer
  and returns (a)

**Severity.** High for product differentiation; moderate effort to
implement.

---

## Triage priority when picking this up

1. **#2 (textarea auto-scroll)** — highest leverage for demo credibility,
   simplest fix
2. **#4 (no terminal state at 100%)** — small copy + style change, closes
   the interview narrative cleanly
3. **#3 (voice session leak)** — user-facing bug, moderate fix
4. **#1 (API key validation UI)** — silent-failure edge case, low frequency
   once the first-time confusion is past

All three are Tailwind + component-level changes with no store or API
surface touched. Each should be a standalone commit with a focused manual
test. None require a new dependency or a schema change.
