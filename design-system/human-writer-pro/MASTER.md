# Design System Master File — Human Writer Pro

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Human Writer Pro
**Generated:** 2026-04-13 (auto-pick from ui-ux-pro-max; overridden with synthesized triple-stack)
**Category:** Editorial Writing Tool (workspace + landing page)
**Stack:** Next.js 14 + Tailwind + shadcn/ui + TypeScript

---

## Global Rules

### Color Palette — "Architecture / Interior" (ink-on-manuscript)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#171717` | `--color-primary` | Primary text, primary buttons, active states |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text on primary buttons |
| Secondary | `#404040` | `--color-secondary` | Secondary text, muted UI |
| On Secondary | `#FFFFFF` | `--color-on-secondary` | — |
| Accent/CTA | `#A16207` | `--color-accent` | Gold accent for VR pass badges, CTAs, emphasis |
| On Accent | `#FFFFFF` | `--color-on-accent` | Text on gold CTAs |
| Background | `#FAFAF7` | `--color-background` | Paper-feel off-white page background |
| Foreground | `#171717` | `--color-foreground` | Default text on background |
| Card | `#FFFFFF` | `--color-card` | Panel backgrounds (interview, output) |
| Card Foreground | `#171717` | `--color-card-foreground` | Text on cards |
| Muted | `#F4F4F0` | `--color-muted` | Subtle fill for raw transcript panel |
| Muted Foreground | `#64748B` | `--color-muted-foreground` | Secondary text, captions, labels |
| Border | `#E5E5E5` | `--color-border` | All borders |
| Ring | `#171717` | `--color-ring` | Focus rings (2px) |
| Destructive | `#DC2626` | `--color-destructive` | Error states |
| Success (VR pass) | `#15803D` | `--color-success` | Green for VR ≥ 20% |
| Warning (VR borderline) | `#A16207` | `--color-warning` | Gold for VR 15-20% |

**Rationale:** Minimal black-on-paper + gold accent = ink on a page. Deliberately avoids the indigo/teal/gradient SaaS palette that reads as AI-generic. WCAG AAA on primary pairs.

### Typography — "Minimalist Monochrome Editorial" triple stack

- **Display (headings, hero, marketing moments):** `Playfair Display` (weights 400, 700, 900)
- **Body (output panel, prose, interview chat, all main UI text):** `Source Serif 4` (weights 300, 400, 500, 600)
- **Mono (raw transcript panel, VR badges, metadata, code, timestamps):** `JetBrains Mono` (weights 400, 500)

**Zero UI sans-serif.** 100% serif/mono. This is a writing tool — typography IS the product voice.

**Google Fonts URL:**
```
https://fonts.google.com/share?selection.family=JetBrains+Mono:wght@400;500|Playfair+Display:wght@400;700;900|Source+Serif+4:wght@300;400;500;600
```

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:wght@300;400;500;600&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  display: ['Playfair Display', 'Georgia', 'serif'],
  body:    ['Source Serif 4', 'Georgia', 'serif'],
  mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
}
```

**Type scale:**
| Token | Size | Line-height | Usage |
|-------|------|-------------|-------|
| `display-hero` | clamp(2.5rem, 6vw, 5rem) | 0.95 | Landing page hero (Playfair 900, tracking-tighter) |
| `display-section` | 2rem | 1.1 | Workspace section titles (Playfair 700) |
| `body-lead` | 1.25rem (20px) | 1.7 | Output panel lead prose (Source Serif 400) |
| `body-base` | 1.125rem (18px) | 1.7 | Output panel body prose (Source Serif 400) |
| `body-sm` | 1rem (16px) | 1.5 | UI body text, interview chat |
| `label-caps` | 0.75rem (12px) | 1 | Uppercase tracking-widest labels (JetBrains Mono) |
| `mono-transcript` | 0.9375rem (15px) | 1.6 | Raw transcript panel (JetBrains Mono) |

### Spacing Variables (8pt rhythm)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps, inline icon spacing |
| `--space-sm` | 8px | Icon gaps, chip padding |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Panel internal padding |
| `--space-xl` | 32px | Between-panel gutters |
| `--space-2xl` | 48px | Section margins |
| `--space-3xl` | 64px | Hero padding |

### Shadow Depths — minimal (editorial aesthetic)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | `none` | Default — no shadow on panels |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | Button hover only |
| `--shadow-focus` | `0 0 0 2px #171717, 0 0 0 4px #FAFAF7` | Focus ring |

**Deliberately minimal.** Editorial aesthetic relies on typography + spacing, not drop shadows. No soft cards, no layered elevation.

---

## Component Specs

### Buttons

```css
/* Primary — gold ink CTA */
.btn-primary {
  background: #A16207;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 2px;              /* sharp edges, not rounded pills */
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { background: #854D0E; }

/* Secondary — outlined, quiet */
.btn-secondary {
  background: transparent;
  color: #171717;
  border: 1px solid #171717;
  padding: 12px 24px;
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-secondary:hover { background: #171717; color: #FFFFFF; }
```

### Panels (replaces "cards" — editorial framing)

```css
.panel {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 2px;
  padding: 24px;
  /* no shadow by default — editorial aesthetic */
}
.panel-raw {
  background: #F4F4F0;              /* paper texture */
  border-left: 2px solid #A16207;   /* gold rule signals "raw source" */
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  line-height: 1.6;
  padding: 16px 20px;
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: 16px;
  line-height: 1.5;
  transition: border-color 200ms ease;
}
.input:focus {
  border-color: #171717;
  outline: none;
  box-shadow: 0 0 0 2px #171717;
}
```

### VR Badge (signature component)

```css
.vr-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 2px;
}
.vr-badge--pass { background: #15803D; color: #FFFFFF; }  /* ≥ 20% */
.vr-badge--borderline { background: #A16207; color: #FFFFFF; }  /* 15-20% */
.vr-badge--fail { background: #DC2626; color: #FFFFFF; }  /* < 15% */
```

---

## Layout System

### Workspace (main app)

**Two-panel asymmetric grid** — editorial magazine influence:

```
Desktop (≥1024px):
┌──────────────────────────────────────────────────────────────┐
│ HEADER 64px — Playfair Display section title + mode selector │
├────────────────────────────┬─────────────────────────────────┤
│ LEFT PANEL  (min 40% col)  │ RIGHT PANEL  (60% col)          │
│                            │                                 │
│ ─ Raw Interview (mono)     │ ─ Generated Output (serif)      │
│   border-left: gold rule   │   18px Source Serif 4           │
│                            │   line-height 1.7               │
│ ─ Edit Chat (serif)        │   drop cap on first paragraph   │
│                            │                                 │
│                            │ ─ Status Bar (mono uppercase)   │
└────────────────────────────┴─────────────────────────────────┘

Tablet (768-1023px): stacked panels, interview on top
Mobile (< 768px): single-panel, tab-switcher at top
```

### Landing Page (hosted demo)

**Pattern:** Exaggerated Minimalism + Editorial Grid hybrid
- Hero: clamp(3rem, 10vw, 8rem) Playfair Display 900, tracking-tighter, leading-[0.95]
- Below hero: pull quote treatment with drop cap using ::first-letter
- No feature grid, no "trust badges," no gradient hero backgrounds
- Single gold CTA button ("Try it with your own key") anchored right after hero

---

## Style Guidelines

**Primary Style:** Editorial Grid / Magazine
- Asymmetric 12-col grid, mathematical spacing (8pt rhythm)
- Drop caps on lead paragraphs (`::first-letter` 4em Playfair Display)
- Pull quotes with left-border treatment (1px solid #171717, italic Source Serif)
- Serif body, mono labels, no generic sans
- WCAG AAA contrast on all primary pairs

**Secondary influence (landing only):** Exaggerated Minimalism — oversized typography, single gold accent, extreme negative space

---

## Anti-Patterns (NEVER use)

- ❌ **Emojis as icons** — Use SVG (Lucide primarily; Heroicons secondary)
- ❌ **Rounded pill buttons** — Sharp 2px radius only (editorial, not consumer-app)
- ❌ **Gradient backgrounds** — Solid colors only. No purple-to-pink, no blue-to-teal.
- ❌ **Indigo/teal/purple accents** — Gold `#A16207` only for emphasis
- ❌ **UI sans-serif fonts** — Zero sans-serif. Serif body + mono labels only.
- ❌ **Drop shadows on panels** — Editorial aesthetic. Use borders, not shadows.
- ❌ **Layout-shifting hovers** — No `translateY(-2px)`. Background-color / border-color transitions only.
- ❌ **Bento grid dashboard layout** — We are not Apple-product-page. We are magazine spread.
- ❌ **Emoji VR-status icons** — Use geometric SVG shapes or text labels
- ❌ **Low contrast text** — 4.5:1 minimum (AAA on primary pairs = 7:1)
- ❌ **Instant state changes (0ms)** — Always 150-300ms transitions

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (SVG only — Lucide preferred)
- [ ] All icons same visual weight (1.5px stroke, consistent size tokens)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states 200ms ease, no layout shift
- [ ] Body text contrast ≥ 4.5:1, primary pairs ≥ 7:1 (AAA)
- [ ] Focus rings visible: 2px solid `#171717` + 2px offset
- [ ] `prefers-reduced-motion` respected (animations disabled if set)
- [ ] Responsive tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Fonts loaded with `font-display: swap`
- [ ] `lang="en"` on html, semantic heading hierarchy (h1→h6)
- [ ] VR badges use text labels in addition to color (accessibility)
- [ ] Drop cap on lead paragraph in output panel (editorial signature move)
