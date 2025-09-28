# Design System Guide

## 1. Foundations

### Color Roles (Light → Dark)
- Background: `#ffffff` → `#0f172a`
- Surface / Card: `#ffffff` → `#1e293b` or `#1e293b/#1e293b` (we use `bg-white` / `dark:bg-slate-800`)
- Sidebar: `#0f172a` (`bg-slate-900`) → `#020617` (`dark:bg-slate-950`)
- Border: `#e5e7eb` → `#334155`
- Headings: `#0f172a` → `#f1f5f9`
- Body Text: `#334155` → `#e2e8f0`
- Muted Text: `#64748b` → `#94a3b8`
- Subtle Text: `#94a3b8` → `#64748b`
- Primary (accent): Tailwind `primary` (configure in theme; currently using existing variable) – ensure accessible contrast with white text.

### Semantic Text Utilities
Declared in `styles.css` (raw CSS, no @apply):
- `.text-heading` – heading, high-emphasis
- `.text-body` – default paragraph & standard UI text
- `.text-muted` – secondary info (descriptions, helper text)
- `.text-subtle` – tertiary / metadata (timestamps)

### Spacing & Layout
- Page horizontal padding: `p-6 lg:p-8`
- Page container max width: `max-w-[1400px]`
- Card padding: `p-5` primary, `p-4` for nested/denser areas.
- Vertical section rhythm: `space-y-8` at top level pages.

### Radius / Shape
- Small: 4px
- Medium: 6px
- Large / Panels: 12px (using Tailwind classes `rounded-lg` / `rounded-xl`).

### Shadows
- Light surfaces: subtle `shadow-sm` only (avoid heavy drop shadows for clarity).

### Motion
- Standard transitions: 150–200ms ease for color & border.
- Large expand/collapse (sidebar section) uses height animation; reduced-motion users get no height transition via targeted classes (`collapse-transition`, `.motion-soft`).
- Removed global disable to retain focus & hover clarity.

## 2. Components

### Button Variants (`components/ui/Button.jsx`)
- `primary`: Solid primary background, white text.
- `secondary`: Slate solid alternative for neutral actions.
- `outline`: White (or dark surface) background with border.
- `subtle`: Low-emphasis surface background (slate tint) with hover elevation.
- `ghost`: No structural background; hover adds tint.
- `danger`: Rose emphasis for destructive actions.
All include focus-visible ring (`focus-visible:ring-primary/40`) except danger uses rose ring.

### Sidebar
- Background: `bg-slate-900` (light mode) / `bg-slate-950` (dark mode) for high contrast.
- Inactive link: `text-slate-400`.
- Hover link: `text-slate-100` + `bg-slate-800/60`.
- Active link: `bg-slate-800/80` + `text-slate-100` + accent left bar.
- Focus ring: primary ring with offset to remain visible against dark background.
- Section headers: uppercase small caps, hover lighten.
- Keyboard navigation: Arrow keys, Home/End support.

### Cards / Panels
- Solid backgrounds only (`bg-white` / `dark:bg-slate-800`).
- Uniform border color (`border-slate-200` / `dark:border-slate-700`).
- Content heading inside panel uses `.text-body` with `font-semibold` at `text-sm`.

### Dashboard Components
- `StatCard`: Emphasized value uses `.text-heading`; label row uses `.text-muted`.
- `ActivityList`: Title `.text-heading`, metadata `.text-muted`, timestamp `.text-subtle`.
- `AlertsPanel`: Tone-specific backgrounds with neutral count badge.
- `QuickActions`: Solid cards with semantic text & subdued description.

## 3. Accessibility
- Color contrast target: AA for all body text (>= 4.5:1). Muted text remains above 4.5:1 vs background; subtle text reserved for meta on high-contrast surfaces.
- Focus: uses visible ring (`focus-visible:ring-*`) and offset for dark sidebar.
- Motion: large, decorative transitions disabled under `prefers-reduced-motion`. Core feedback (focus/hover) retained.
- Keyboard: Sidebar headers and links navigable via arrow keys.

## 4. Theming Strategy (Future)
- Introduce CSS custom properties (e.g., `--color-bg-surface`, `--color-text-muted`) and map Tailwind theme extensions to them for dynamic theme switching beyond dark/light (e.g., institution accent color override).
- Provide runtime brand primary color override via a single root variable updated from settings.

## 5. Implementation Checklist (Completed)
- Semantic typography utilities
- Solid panel backgrounds
- Button variants unification
- Sidebar contrast & states
- Reduced-motion refinement

## 6. Pending / Future Enhancements
- Tokenize spacing scale & sync with Tailwind config.
- Add `Input` component for consistent search & form fields (currently search bar inline styled).
- Add `EmptyState` + `Skeleton` usage patterns doc.
- Multi-accent support (per module color channels) via additional hue tokens.
- Add unit tests for accessibility (axe-core integration) in CI.

## 7. Usage Example
```jsx
<h1 className="text-heading text-2xl mb-4">Students</h1>
<p className="text-body">Manage enrollment, demographics and performance.</p>
<p className="text-muted mt-2">Last synced 5 minutes ago.</p>
```

---
This document should evolve with design decisions; keep changes atomic and reference commit hashes for major shifts.
