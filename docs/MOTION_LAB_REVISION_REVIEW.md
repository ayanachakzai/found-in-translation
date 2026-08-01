# Frontend design review — Motion Lab revision

## Context

- Purpose: prove a physically legible recognition-to-print sequence without
  changing the main website.
- Aesthetic direction: quiet kinetic installation in a dim exhibition room.
- User task: scroll or scrub one reversible sequence and understand which
  object is recognised, when generation begins, and when the receipt prints.
- Review mode: independent creative frontend review after implementation.
- Design-system exception: this isolated prototype has no Figma component
  library. Its visual tokens and typography rules are documented in
  `NEW_VISUAL_DIRECTION.md` and `TYPOGRAPHY_DIRECTIONS.md`.

## Summary

**Pass.** The revision establishes distinct recognition and printing stages,
removes scanner-decoration clutter, and gives the printer a clear late-stage
hero role. No blocking or major design issues were found in the six production
captures.

## Required questions

### Is the sequence cleaner and less cluttered?

Yes. Scan cone, scan bar, path traces, vertical decorative progress rail and
paper-roll model are absent. Only one status line accompanies the physical
action. The 60% frame deliberately leaves the centre empty during the hand-off.

### Is recognition understandable without scan overlays?

Yes. At 20% the star is aligned to the webcam lens and `Star recognised` is the
only visible status. At 40% the rose occupies the same recognition position and
`Rose recognised` replaces it. A restrained lens practical and webcam dip
support the language without imitating a scanner.

### Do objects leave the active frame after recognition?

Yes. The star recedes to a small upper-left archive pose before the rose begins.
The rose then recedes lower-left. At 60% both are peripheral, and the webcam
clears the centre into a separate left-side recess.

### Does the printer become the clear main object at the right time?

Yes. `Generating story` occupies the 60% hand-off while the centre is open. The
printer advances into that centre between 61% and 70%, enlarges, gains a warm
rim and grounded shadow, and is the dominant object at 80% and 100%.

### Is the separate paper roll removed?

Yes. Browser resource inspection loads only `star.glb`, `rose.glb`,
`webcam.glb` and `receipt-printer.glb`. No paper-roll model is rendered or
preloaded by `/motion-lab`.

### Is the receipt emergence clear and elegant?

Yes. The 80% capture shows the first printed paper below the central slot. The
100% capture shows the complete strip with progressive copy, a slight forward
curl and asymmetric hang. Text is absent before paper feed and is revealed by
the same feed uniform as paper length.

### Does the whole sequence feel like one intentional installation?

Yes. One fixed camera, one reused centre, a visible wall/floor break, consistent
negative space and the cool-to-warm lighting hand-off connect all four acts.
The condensed exhibition-label typography and unframed status language avoid
generic AI-editorial and dashboard treatment.

## Pillar assessment

| Pillar | Status | Notes |
|---|---|---|
| Frictionless | Pass | Scroll and developer scrub are the only controls; status makes each act legible. |
| Quality craft | Pass | Distinct staging, reversible master timeline, responsive fit, reduced-motion and no-WebGL paths verified. |
| Trustworthy | Pass | Loading and model failure states remain explicit; fallback describes the same causal sequence. |

## Motion and visual QA

- Abrupt movement: none found. Forward and reverse 40% captures are
  byte-identical, confirming deterministic pose reversal.
- Unintended overlap: none found. Object/webcam overlap occurs only at the two
  recognition poses; archived objects do not collect around the printer.
- Clipping: none found at `1440×900` or `390×844`; mobile has no horizontal
  overflow.
- Incorrect orientation: none found. Star and rose face the audience at 0% and
  resolve continuously toward the lens for their recognition poses.
- Generic treatment: none found. There are no cards, interface boxes,
  holographic graphics, neon scan effects or repeated content sections.
- Console: zero errors; one Three.js dependency deprecation warning remains.

## Minor constraints

- The supplied rose, webcam and printer GLBs remain high-polygon and produce the
  existing large Three.js/model-preparation chunk warning. The prototype limits
  DPR, uses demand rendering, animates transforms/light/uniform values only, and
  removes the paper-roll request, but source-asset optimisation is still the
  future route to a materially smaller payload.
- The printer's dark glossy source material keeps some housing faces subdued.
  The revised key/fill/rim setup makes the silhouette and slot readable without
  destructively changing the GLB.

## Production captures

- `website/output/playwright/motion-lab-revision/motion-lab-000.png`
- `website/output/playwright/motion-lab-revision/motion-lab-020.png`
- `website/output/playwright/motion-lab-revision/motion-lab-040.png`
- `website/output/playwright/motion-lab-revision/motion-lab-060.png`
- `website/output/playwright/motion-lab-revision/motion-lab-080.png`
- `website/output/playwright/motion-lab-revision/motion-lab-100.png`
