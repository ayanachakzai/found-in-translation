# Motion Lab — capture record

Captured with the isolated `/motion-lab` developer API after model loading.
Files are in `website/output/playwright/motion-lab-revision/`.

| Progress | Marker | Status | Visible active models | Check |
|---:|---|---|---|---|
| 0% | `audience-pose` | Choose two objects | star, rose, webcam | Lens is left-facing and tokens are clearly separated. |
| 15% | `star-approach` | Choose two objects | star, rose, webcam | Star uses upper curve; printer remains off-frame. |
| 25% | `star-approach` | Choose two objects | star, rose, webcam | Star is approaching with no lens intersection. |
| 38% | `rose-approach` | Star recognised | rose, webcam; star peripheral | Star has cleared before rose becomes active. |
| 50% | `rose-recognised` | Rose recognised | rose, webcam; star peripheral | Rose holds at readable lens distance. |
| 60% | `generation` | Generating story | clearing webcam/tokens | Recognition rig falls before printer arrival. |
| 70% | `printer-enter` | Generating story | printer entering | Printer is the sole central destination. |
| 82% | `printing` | Printing receipt | printer, emerging receipt | Paper begins directly below printer output. |
| 92% | `printing` | Printing receipt | printer, fed receipt | Printed region follows exposed paper. |
| 100% | `story-complete` | Story complete | printer, completed receipt | Printer remains hero; token stage stays clear. |

Additional captures: `final-recognition-lens.png`, `final-printer-pose.png`,
`final-laptop-0.png`, `final-laptop-100.png`, `final-mobile-recognition.png`,
and `final-mobile-receipt.png`.

The webcam close-up verifies the circular physical lens face, not the Insta360
branded rear panel, faces the incoming star. Desktop (1440×900), laptop
(1280×800), and mobile (390×844) captures contain no horizontal overflow.

## Lighting correction record

The rejected render used ACES filmic tone mapping at `1.08` exposure. Browser
inspection confirmed the canvas itself was opaque (`1`), unfiltered and normally
blended against `rgb(12, 13, 15)`; there is no CSS dimming layer, fog, ambient
occlusion or global bloom. The correction uses explicit ACES exposure `1.22`,
permanent ambient (`2.5`), hemisphere (`2.35`) and frontal RectAreaLight (`4.6`)
fill. Recognition adds lens-targeted cool keys; black materials retain their
restrained charcoal lift rather than becoming grey. During feed, the warm slot
and paper practical rise to `4.2` / `5.2` then settle at `2.55` / `2.85`.

Comparison captures: `lighting-before-star-recognised.png` and
`lighting-after-star-recognised.png`; printing captures:
`lighting-active-printing-warm-82.png` and `lighting-story-complete-warm.png`.
