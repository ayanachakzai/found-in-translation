# Implementation audit

Audit date: 2026-07-24  
Scope: repository state before the Phase 0 and Phase 1 website implementation

## Repository layout

The working folder is `/Users/ayanachakzai/Downloads/found_in_translation-main`. It is not currently a Git worktree: `git rev-parse --show-toplevel` returned no repository, so branch state and pre-existing Git changes could not be inspected.

The repository is arranged as an overlay rather than as the single merged tree described by the launch pack:

```text
found_in_translation-main/
├── 3D-Object-Recognition/       # recognition code, classifier and source STLs
├── Arduino-Thermal-Printer/     # printer firmware
├── Current-Lora/                # current RAG/LoRA and exploratory agent code
├── Data-collection-processing-cleaning/
├── Old-Lora/
├── Old-RAG&Embeddings/
├── found-in-translation-codex-launch-pack/
│   ├── .agents/skills/          # four project skills
│   ├── .github/workflows/       # proposed Pages workflow
│   ├── AGENTS.md                # effective project instructions
│   ├── docs/                    # source of truth, storyboard and build plan
│   └── website/                 # README and a duplicate receipt JSON
├── website/
│   └── public/
│       ├── data/receipts.json
│       └── models/*.glb
├── found_in_translation_DATASHEET.csv
└── found_in_translation_windows.py
```

There was no `AGENTS.md`, `docs/`, `.agents/`, or `.github/` at the working-folder root before implementation. The only `AGENTS.md` and requested planning documents were under `found-in-translation-codex-launch-pack/`; those were therefore treated as the effective root instructions. The live website location is the root-level `website/`, because it contains all supplied production assets. The launch-pack receipt JSON is byte-identical to the live copy (SHA-256 `e1082e08a0d68c0b529713a3d2b2cde509611d995f558bfff2652798851ad47d`).

Source research files were inspected but not changed.

## GLB inventory

All ten expected models are present. A binary-level glTF 2.0 inspection confirmed every header, declared byte length, JSON chunk, scene graph and embedded image is readable. Total model payload is **111,824,320 bytes (106.64 MiB)**. Bounds below include node transforms and use glTF's metre-unit convention; several exports are plainly not normalised to a useful shared real-world scale. glTF defines +Y as up, but an intentional visual “forward” direction is not encoded and must be established during Phase 2.

| Model | Bytes | Scene roots / nodes | Meshes / primitives / triangles | Materials; textures | Animations | World dimensions; centre |
|---|---:|---|---:|---|---|---|
| `arduino.glb` | 4,491,236 | `Sketchfab_model`; 108 nodes | 34 / 34 / 8,136 | 34; 11 PNGs (10× 2048², 1× 8²) | none | 1.16383 × 0.82628 × 0.18369; −0.02225, 0.03328, 0.25778 |
| `crown.glb` | 4,387,592 | `Crown`, `Cube`; 2 nodes | 2 / 2 / 80,500 | 2; none | none | 180.83290 × 27.32350 × 37.57332; −72.74656, 13.38538, 0 |
| `old_book.glb` | 3,012,744 | `Sketchfab_model`; 5 nodes | 1 / 1 / 214 | 1; 3 PNGs at 1024² | none | 0.07122 × 0.00861 × 0.05041; 0, 0, 0.00058 |
| `owl.glb` | 66,780 | `Cube`, `Cube.001`, `lowpolyowl`; 3 nodes | 3 / 3 / 850 | 3; none | none | 183.44038 × 51.37004 × 45.48662; −71.44282, 24.68502, −2.59395 |
| `paper-roll.glb` | 20,772 | `Sketchfab_model`; 6 nodes | 2 / 2 / 396 | 2; none | none | 0.16314 × 0.18000 × 0.16206; −0.00066, 0, −0.00077 |
| `receipt-printer.glb` | 11,363,772 | `world`; 2 nodes | 1 / 1 / 298,766 | 1; 2 WebPs at 2048² | none | 0.89218 × 0.60488 × 1.00124; 0.00040, −0.00128, −0.00016 |
| `rose.glb` | 35,036,964 | `Cube`, `rosebud`; 2 nodes | 2 / 2 / 674,742 | 2; none | none | 187.32419 × 30.33469 × 45.08847; −69.50092, 14.22181, −6.62753 |
| `snake.glb` | 26,900,592 | `Cube`, `single_color-25`; 2 nodes | 2 / 2 / 500,012 | 2; none | none | 192.56282 × 57.55648 × 62.93090; −66.88160, 18.86514, −30.46545 |
| `star.glb` | 4,193,412 | `5d9253398c9e4efc349569ffd16b8340`; 1 node | 1 / 1 / 50,000 | 1; none | none | 33.57718 × 37.83507 × 12.34847; 8.16380, 22.23160, 10.46056 |
| `webcam.glb` | 22,350,456 | 22 roots including `Extruded.001`, `Revolved.001`, `logo 1`, `top`, `bottom`, `Circle`; 22 nodes | 22 / 22 / 570,664 | 9; 3 PNGs (2319×578, 1305×362, 1645×380) | none | 0.87735 × 1.08397 × 0.54904; 0.05506, 0.55423, −0.06797 |

### Asset findings

- All files are static; **none contains an animation clip**. Book opening, printer feed, roll rotation and camera focus cannot rely on embedded animations.
- `receipt-printer.glb` requires `EXT_texture_webp`; browser support must be verified in the Phase 2 loader.
- `webcam.glb` uses `KHR_materials_transmission` and `KHR_materials_ior`.
- Explicit node scale is 1 on every asset except the star (uniform 36.61634) and 20 of the webcam's 22 roots (uniform 0.260326). The world dimensions in the table include these transforms.
- The webcam's complete set of scene roots is `Extruded.001`, `Extruded.004`, `Extruded.002`, `Face_sheet.001`, `Face_sheet.002`, `Face_sheet.003`, `Lofted.002`, `Revolved.001`, `Solid_181`, `Solid_183`, `Solid_217`, `Solid_221`, `Solid_277`, `Solid_283`, `Solid_2891`, `Solid_2897`, `Solid_2955`, `Solid_2962`, `logo 1`, `top`, `bottom`, and `Circle`.
- The token exports are inconsistent. `owl.glb`, `crown.glb`, `rose.glb` and `snake.glb` include an extra node named `Cube` at approximately X = −162, producing very large, off-centre bounds. The star is also translated and scaled far from a normalised local origin. Phase 2 must centre and scale named token meshes in code or use non-destructive derivatives.
- Rose (674,742 triangles), webcam (570,664), snake (500,012) and printer (298,766) are heavy for the stated runtime targets. Rose is 35.04 MB versus the suggested 300–500 KB token target; webcam is 22.35 MB versus 700 KB; printer is 11.36 MB versus 1.5 MB. They must be lazy-loaded and should be optimised only in a later asset/3D phase after visual comparison.
- Only the Arduino, book and paper-roll files contain embedded source and licence metadata:
  - Arduino Uno by kakaeka, CC BY 4.0, Sketchfab source embedded.
  - Leather Book by NameNotVisible, CC BY-NC 4.0, Sketchfab source embedded.
  - Toilet Paper Roll by Maggatron, CC BY 4.0, Sketchfab source embedded.
- The other seven files contain no embedded licence/source credit. Their reuse rights and required attribution could not be validated from the repository and must be confirmed before public deployment. The book's non-commercial licence also needs a deployment-use review.

## Receipt archive validation

`website/public/data/receipts.json` parses as JSON and declares 14 receipts; the array also contains exactly 14. Validation checked required fields, unique IDs and source filenames, ISO-8601 timestamps, mode/array cardinality, object-to-theme mappings, non-empty stories, stored word counts, display labels and Cultural DNA percentage totals.

Results:

- 14 unique, valid records: 12 `single`, 2 `remix`.
- Coverage is pink rose / Love, blue star / Mysticism, purple owl / Wisdom and green snake / Greed.
- No yellow crown / Power receipt exists.
- The default recorded remix `20260610_134437` is present with blue star + pink rose, Mysticism + Love, timestamp `2026-06-10T13:44:00`, and Latin America 50% / India 50%.
- Seven Cultural DNA objects sum to 100. Seven sum to 99 because thirds are stored as 33/33/33; this is consistent with rounded receipt output and was accepted.
- No schema violation or invented filler record was found.

## Independent dataset count

The CSV was parsed with `utf-8-sig` and Python's RFC-compatible `csv.DictReader`, so quoted multiline story text was handled as one record. A valid story was required to have non-empty `title`, `origin`, `language`, `themes`, positive integer `word_count`, and `text_english`, with every theme inside the five controlled labels.

| Result | Count |
|---|---:|
| Rows after the header | 243 |
| Valid story rows | **231** |
| Excluded rows | 12 |
| Fully blank pre-summary rows | 2 |
| Incomplete pre-summary rows | 1 |
| Summary/header rows at the bottom | 9 |

The valid current-file origin counts are Afghanistan 46, China 36, Germany 22, India 25, Latin America **35**, Pakistan 57 and Romania 10. They total **231**. The 18 language-label counts otherwise match the source-of-truth document, including Spanish **35**.

This conflicts with `docs/CONTENT_SOURCE_OF_TRUTH.md`, which states 232 stories and Latin America 36. The cause visible in the CSV is one pre-summary row whose only populated field is `origin = Latin America`; title, language, themes, word count and English text are all empty. It cannot be treated as a valid story under the repository content skill. The bottom summary appears to count it, while the actual complete records do not.

The website should therefore describe **231 complete story records in the current CSV** and disclose the documented 232/231 discrepancy until the missing Latin America record is restored or the source-of-truth count is corrected. The CSV and research documentation were not modified.

## Phase 0 implementation decisions

- Use the root-level `website/` as the Vite application.
- Keep all supplied GLBs and receipt JSON unchanged.
- Resolve public paths through Vite `BASE_URL`; never use root-absolute model/data URLs.
- Add a typed central asset manifest and a runtime-validating receipt schema.
- Do not load or render GLBs in Phases 0–1. A semantic/CSS visual stage and an explicit no-3D mode will hold the place for the persistent Phase 2 canvas.
- Carry the entire causal workflow in landmarks, headings, prose and lists so WebGL and animation are enhancements rather than content dependencies.

## Phase 2 implementation and asset audit

Audit date: 2026-07-24  
Scope: persistent React Three Fiber stage and all supplied GLBs

Phase 2 adds one fixed, optional canvas without changing the source GLBs, dataset,
receipt archive or narrative facts. The semantic page remains complete when the
canvas is loading, disabled, unavailable or loses its WebGL context. The canvas
uses a central registry, code-side bounding-box centring and scale correction,
responsive camera presets, restrained idle transforms for the five tokens, capped
device pixel ratio, no shadows, no post-processing and demand rendering whenever
no idle object is visible. The Three.js bundle is a lazy application chunk;
non-hero models are mounted progressively as their sections are reached and stay
mounted so scene changes do not re-download them.

No camera-to-printer travel, scanner choreography, procedural paper feed or
printing sequence was implemented. Those remain later phases.

### Phase 2 model inspection

No external texture URI is present in any GLB. The asset validator resolved all
31 material texture references to 19 embedded images, so there are **no missing
texture files or broken texture indices** in the supplied set. A texture-free
entry below means the material intentionally uses PBR colour values rather than
that a file is missing.

| Model | Size | Texture and material findings | Licence/source status | Blender correction assessment |
|---|---:|---|---|---|
| `owl.glb` | 66,780 B / 0.07 MB | Three colour-only materials; no missing textures. Two helper meshes surround the intended `lowpolyowl` mesh. | No embedded creator, source or licence; unresolved. | Recommended: delete helpers, apply transforms and set the origin. Phase 2 selects and centres only `lowpolyowl` in code. |
| `snake.glb` | 26,900,592 B / 26.90 MB | Two colour-only materials; 500,012 triangles and an unwanted `Cube`. | No embedded creator, source or licence; unresolved. | Required before production optimisation: remove helper, apply transforms and decimate/retopologise. Phase 2 filters and centres the intended mesh in code. |
| `rose.glb` | 35,036,964 B / 35.04 MB | Two colour-only materials; 674,742 triangles and an unwanted `Cube`. | No embedded creator, source or licence; unresolved. | Required before production optimisation: remove helper, apply transforms and decimate/retopologise while preserving the silhouette. Phase 2 filters and centres `rosebud` in code. |
| `crown.glb` | 4,387,592 B / 4.39 MB | Two colour-only materials; 80,500 triangles and an unwanted `Cube`. | No embedded creator, source or licence; unresolved. | Recommended: remove helper, apply transforms, set origin and reduce geometry. Phase 2 filters and centres `Crown` in code. |
| `star.glb` | 4,193,412 B / 4.19 MB | One colour-only material; no missing textures. Its only node has a large baked translation and uniform scale. | No embedded creator, source or licence; unresolved. | Recommended: apply transforms, centre the origin and reduce the 50,000-triangle mesh. Phase 2 corrects it non-destructively in code. |
| `webcam.glb` | 22,350,456 B / 22.35 MB | Nine materials and three embedded non-square PNGs. Alpha-blended logo/surface materials plus `KHR_materials_transmission` and `KHR_materials_ior` add draw cost; no references are broken. | No embedded creator, source or licence; unresolved. | Required for a production-size asset: consolidate 22 mesh roots/materials and retopologise 570,664 triangles. Preserve separate glass/logo parts. |
| `old_book.glb` | 3,012,744 B / 3.01 MB | One PBR material with embedded 1024² base-colour, metallic/roughness/AO and normal PNGs. No missing textures or material fault found. | **Leather Book** by **NameNotVisible (@jayprataps36)**, [Sketchfab source](https://sketchfab.com/3d-models/leather-book-a86010ad79aa44d3ac7df5897060ccb6), [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Exact details match both embedded metadata and the source page. | No correction is needed for the Phase 2 still display. A later opening-page animation would require separating/rigging the single mesh in Blender. |
| `receipt-printer.glb` | 11,363,772 B / 11.36 MB | One very dark metallic/rough material with two embedded 2048² WebPs. `EXT_texture_webp` is both used and required; Three.js loads it successfully. | No embedded creator, source or licence; unresolved. | Required for later printing choreography: retopologise the single 298,766-triangle mesh and separate any body, lid or slot parts that must react. |
| `paper-roll.glb` | 20,772 B / 0.02 MB | Two colour-only materials; no missing textures and negligible geometry cost. | **Toilet Paper Roll** by **Maggatron (@MaggaModels)**, embedded Sketchfab source, CC BY 4.0. | No Phase 2 correction required. Check the visual metaphor before later animation because the embedded title identifies a toilet-paper model. |
| `arduino.glb` | 4,491,236 B / 4.49 MB | 34 materials and 11 embedded PNGs: ten 2048² and one 8². No broken references, but the material/texture count is high for a small supporting object. | **Arduino Uno** by **kakaeka**, embedded Sketchfab source, CC BY 4.0. | No Phase 2 geometry correction required. A later derivative should consolidate materials and downsize textures. |

The supplied models contain no animation clips. The source GLBs were not edited;
all Phase 2 centring, scale, orientation and placement corrections are registry
data applied at runtime. Source GLB attribution is now rendered from that same
registry in the site credits. The old book is used only for this non-commercial
academic research project.

### Performance and deployment concerns

- The total GLB payload remains **111,824,320 bytes (106.64 MiB)**. The five-token
  hero group alone is about 70.59 MB, so the optional stage can still be costly on
  a cold mobile connection even though the application and later scene assets are
  lazy.
- Rose, webcam, snake and printer together contribute more than two million
  triangles. Hidden models remain cached after their first use to avoid network
  churn; late in a complete session this increases retained CPU/GPU memory.
- Arduino's ten 2048² textures, printer's two 2048² textures, webcam transmission
  and alpha-blended materials are avoidable memory/draw-call pressure.
- DPR is capped at 1.5 desktop, 1.3 tablet and 1.1 compact; compact rendering
  disables antialiasing. Shadows, environment maps and post-processing are not
  enabled.
- The renderer runs continuously only while one of the five restrained idle
  objects is visible and motion is enabled. Reduced-motion mode and still
  book/printer/Arduino scenes use demand rendering.
- Vite emits a size warning for the isolated optional Three.js stage chunk
  (961.06 KB minified / 257.66 KB gzip). The semantic application chunk remains
  216.68 KB minified / 68.93 KB gzip.
- Seven models have no repository-embedded reuse terms. Their provenance and
  public-deployment permission remain a release blocker. No deployment was
  attempted in Phase 2.

### Phase 2 validation status

- Binary GLB validation confirms ten glTF 2.0 files, correct declared lengths,
  readable JSON/BIN chunks, self-contained images and valid material references.
- Runtime browser validation loads all ten distinct GLBs through one persistent
  canvas, including the required WebP printer textures and transmitted webcam
  material.
- Desktop (1440 × 1000), tablet (820 × 1180) and compact mobile (390 × 844)
  layouts were exercised. Model framing was corrected after screenshot review;
  semantic reading order and no-3D content remain unchanged.
- The browser emits a Three.js deprecation warning for the library's internal
  `Clock` use. It does not affect the build or application behaviour and is not
  caused by project code.
