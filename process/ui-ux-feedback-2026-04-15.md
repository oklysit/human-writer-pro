# UI/UX Feedback — 2026-04-15

Captured during the live end-to-end CrowdStrike CL run after Letter 4 was produced. User had just spent ~20 min in the live app and surfaced friction points that didn't show up in the headless browser test.

## Friction points

### 1. Voice dictation textarea overflow (BUG)

When dictated speech length exceeds the textarea visible height, newest words land below the visible region. The textarea does not auto-scroll. User can't verify accuracy or correct in real time.

**Fix sketch:** In `components/interview-panel.tsx` live-preview useEffect (≈ lines 59-67), after `setInputValue(...)`, scroll the textarea to its bottom:

```
textareaRef.current?.scrollTo({ top: textareaRef.current.scrollHeight });
```

Need to add a ref to the Textarea. Also worth considering an auto-grow pattern so the textarea expands to fit content (with sensible max-height + scroll fallback).

### 2. Panel structure feels off vs. classic LLM chat (DESIGN)

Current layout:
- Header (logo + settings)
- Left panel = Interview (Context input on top, turn history below, input box at bottom)
- Right panel = Output ("Your assembled piece will appear here")

User wants chat-paradigm structure:
- Single chat surface on the left
- First turn could be a model-driven "Welcome to Human Writer Pro! What are you writing?" OR user's pasted/uploaded context as the first user message
- Interview header should have nothing instead of a redundant "Interview" label
- Empty Output panel placeholder feels off — output should appear inline in chat OR animate in to indicate work

**Fix sketch:** Restructure InterviewPanel into a chat metaphor. Combine Context + Interview turns into a single message thread. Render uploaded files as chips (not as `--- From: filename ---` headers in the textarea — see #4). Bundle this restructure with Edit Chat / Task 16 since both move toward the same paradigm.

### 3. Assessment notification banner feels redundant (DESIGN)

The "Last answer: sufficient — advancing" / "partially sufficient" / "insufficient" banner shows persistently in the header region. User finds it odd:

> "those notifications should show similar to this recap that Claude Code recently implemented, just in-line in chat just to tell the user 'hey, here's where we're at in the interview and how effective your recent response was.' Or remove it entirely I don't know that it's necessary if the interview is going well and the interviewing agent is surfacing good questions. This last interview was great and the interviewer even pushed back at my framing myself less confidently instead of more."

**Fix sketch:** Two options:
- (a) Render assessment as inline chat metadata under the relevant turn — Claude-Code-recap-style ("This response covered X but missed Y. Following up.")
- (b) Remove the banner entirely. Trust the interviewer's pushback to do the work. The user observed that the interviewer pushing back ("you described InCalmo from memory... why aren't those the answer?") was MORE valuable than the assessment label.

Option (b) is the smaller change. Worth A/B-ing later.

### 4. File uploads should be clickable chips (DESIGN)

Currently uploaded file content is appended to the contextNotes textarea with a `--- From: filename ---` header. User wants normal LLM chat behavior: a clickable file-icon chip showing the filename, persistent in the message context, removable.

**Fix sketch:** Track uploaded files as separate state alongside `contextNotes` (e.g. `uploadedFiles: { name, content, type }[]`). Render chips above the textarea. On send/interview-start, concatenate file content into the assembler input. Removing a chip removes it from the input.

### 5. No progress feedback during model work (DESIGN)

Between user submit and next question / between Assemble and output, the UI just stops. No "thinking" indicator, no animation. User compared to modern LLM chats which always show some animation or "analyzing response" text.

> "the stops after responding and the waits for the next question don't give feedback the way modern llm chats usually do to let the user know work is happening"

User noted output streaming animation may already exist in production but wasn't visible in this test.

**Fix sketch:** Two complementary additions:
- A "thinking" / "analyzing your response" indicator below the latest user turn while waiting for the next question. Animated dots or a subtle pulse.
- For Assemble, ensure the streaming output is visible as it populates (verify the prod streaming path works in dev).

### 6. Submit binding should be Enter (chat-norm), not Cmd+Enter (CHANGE)

Currently submit is bound to Cmd+Enter and shows a hint "Cmd+Enter to send" beneath the textarea. User wants standard chat conventions:
- **Enter → send**
- **Shift+Enter → newline**
- Drop the visible hint entirely (chat users know the conventions)

**Fix sketch:** In `components/interview-panel.tsx` `handleKeyDown` (≈ line 200):

```
if (e.key === "Enter" && !e.shiftKey) {
  e.preventDefault();
  void handleSubmit();
}
```

Drop the `<p>Cmd+Enter to send</p>` hint at the bottom of the input area. Apply the same pattern to Edit Chat input when that lands.

## Bundling

These six items should ship together as a UI iteration pass (probably 2-3 hours), in this order of leverage:

1. **#6 Enter-to-send** — 5-minute change, removes daily friction.
2. **#1 Dictation autoscroll** — 15-minute change, fixes a real bug that breaks the dictation experience.
3. **#5 Progress feedback** — 30-60 min, adds visible signal during waits.
4. **#4 File chips** — 1-2 hours, requires state model change but improves UX significantly.
5. **#3 Assessment banner** — defer until #2 chat restructure (option b: just remove).
6. **#2 Chat-paradigm restructure** — bigger, bundle with Edit Chat / Task 16.

Ordering rationale: small high-leverage fixes first (1-3 are tonight-fast), then the structural changes that need more design.
