# Typography directions — Motion Lab

## Chosen direction: exhibition control label

`/motion-lab` uses the language of a small kinetic installation rather than an
AI portfolio, editorial landing page, or software dashboard. Type should feel
like a museum technician labelled the work directly in the room: quiet,
precise, legible from a distance, and subordinate to the moving objects.

The existing italic old-style serif plus terminal monospace pairing is retired
from the prototype. That combination makes the page read as generic
AI-portfolio editorial design and turns the physical recognition sequence into
decorative web content.

## Type roles

### Installation title

Stack:

```css
'Avenir Next Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif
```

- weight: `500`
- case: sentence case
- tracking: `-0.025em`
- line-height: `0.96`
- use: one compact title only

The condensed form references exhibition labels and instrument housings without
imitating receipt typography.

### Status language

Stack:

```css
'Helvetica Neue', Helvetica, Arial, sans-serif
```

- weight: `400`
- case: sentence case
- tracking: `0.01em`
- line-height: `1.2`
- size: `clamp(0.95rem, 1.25vw, 1.2rem)`
- use: `Star recognised`, `Rose recognised`, `Generating story`,
  `Printing receipt`

Status is positioned in open space near the active apparatus. It has no
container, border, pill, glow, icon, or animated ellipsis. A short opacity and
vertical-focus transition is the only interface motion.

### Technical controls

Stack:

```css
'SFMono-Regular', Consolas, 'Liberation Mono', monospace
```

- weight: `400`
- uppercase allowed only for the temporary developer scrubber
- size: `0.62rem`
- tracking: `0.08em`

The monospace face identifies tooling rather than narrative. It is not used for
recognition copy.

## Hierarchy

1. Three-dimensional action
2. Current status
3. Compact installation title
4. Temporary developer controls

No text block may compete with the printer at the generation and receipt acts.
The title stays at the edge of the room; status occupies a single stable line;
controls remain low and visually recessive.

## Copy rules

- Use British spelling: `recognised`.
- State completed or active conditions, not technical processes.
- Do not use `scan`, `AI`, `processing`, `analysing`, percentages, or fake
  machine telemetry in audience-facing copy.
- Do not add descriptive subheads or section labels for each act.
- Keep the four approved states verbatim:
  - `Star recognised`
  - `Rose recognised`
  - `Generating story`
  - `Printing receipt`

## Accessibility

- Status text maintains at least `4.5:1` contrast against the exhibition wall.
- `aria-live="polite"` announces meaningful state changes without interrupting.
- Reduced motion resolves to the final `Printing receipt` state with the full
  receipt visible.
- The developer scrubber retains a visible keyboard focus treatment.
