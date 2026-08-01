# Motion Lab — choreography

The scene has one persistent R3F canvas and one paused GSAP master timeline. A
single scrubbed ScrollTrigger controls its progress. All nine GLB roots, receipt
geometry, lights, camera target and DOM text remain mounted and are animated by
that timeline, so reverse scroll follows the exact same physical path backwards.

| Marker | Approx. range | Choreography |
| --- | --- | --- |
| `archive-intro` | 0–5% | Book anchors a shallow arc of all five themes under warm archive light. |
| `archive-clean` | 5–10% | `OCR · CLEAN · TRANSLATE · LABEL · EMBED` rises briefly from the book. |
| `archive-translate` | 10–16% | Archive illumination steadies; project language clears for training. |
| `training` | 16–21% | The book and object arc make a small intentional regrouping; `LoRA + RAG` crosses the stage. |
| `five-themes` | 21–28% | Wisdom, greed, love, power and mysticism settle briefly by their markers. |
| `token-selection` | 28–33% | Archive models recede, star/rose group left and verified webcam takes right three-quarter pose. |
| `star-approach` | 33–39% | Star takes an upper curved route to the physical lens and turns progressively toward it. |
| `star-recognised` | 39–42% | Brief hold; status and a restrained cool token/webcam acknowledgement peak. |
| `star-clear` | 42–46% | Star recedes upper-left, becoming peripheral. |
| `rose-approach` | 46–53% | Rose takes a separate lower curve to the same lens and rotates during travel. |
| `rose-recognised` | 53–56% | Brief hold with the matching controlled acknowledgement. |
| `recognition-clear` | 56–61% | Rose, webcam and recognition key leave the active centre smoothly. |
| `retrieval` | 61–66% | A small `folklore · wisdom · mysticism · love` fragment crosses from archive. |
| `story-generation` | 66–72% | Cultural DNA vocabulary aligns, then clears; no particles or fake source code. |
| `printer-enter` | 72–81% | Printer moves continuously from the right, grows to hero scale and receives key/rim focus. |
| `thermal-printing` | 81–91% | Warm slot light starts, receipt feed and text reveal progress together, then paper curls. |
| `printing-complete` | 91–94% | Feed settles; warm practical softens while receipt hangs below the slot. |
| `arduino-enter` | 94–98% | Printer shifts slightly and Arduino plus physical cable enter from the right. |
| `arduino-fallback` | 98–99.5% | Arduino indicator rises; fallback status is readable without displacing receipt. |
| `story-archive` | 99.5–100% | Printer, receipt and Arduino form the final hardware tableau. |

## Camera, orientation and lighting

One perspective camera makes only a restrained drift from archive/recognition to
the printer. There is no teleport, roll or abrupt focal length change. Webcam was
visually verified: its lens opening, not the Insta360-branded rear, is visible;
the GLB’s lens axis is oriented leftward and slightly toward camera in the
recognition pose. The persistent fill survives every marker while archive,
recognition and printer keys hand focus across the room. The warm print practical
is limited to the slot, receipt and nearby floor.

## Responsive and reduced-motion adaptation

Desktop keeps the left-to-right flow. On mobile, token/webcam positions compress
into an upper-left to lower-right diagonal, printer becomes centred and Arduino
sits beside/below it so paper stays inside viewport width. The same timeline has
compact pose constants selected by viewport width. With reduced motion, the master
timeline resolves to the calm final tableau, preserving status and receipt reading
without long scrubbed travel.
