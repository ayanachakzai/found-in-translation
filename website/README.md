# Found in Translation website

React + TypeScript + Vite foundation for the single-page installation narrative.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run test
npm run validate:assets
npm run build
npm run test:e2e
```

The Vite base path is inferred from `GITHUB_REPOSITORY` in GitHub Actions. For a local repository-subpath check:

```bash
VITE_BASE_PATH=/found-in-translation/ npm run build
```

Phase 2 adds one optional persistent React Three Fiber stage. The five token
models load with the stage; book, webcam, printer, paper roll and Arduino load
progressively as their sections are reached. Full camera, retrieval and printing
choreography is intentionally reserved for later phases.

All process content and the authentic receipt archive remain available in
semantic HTML with the visual stage disabled, reduced, still loading or WebGL
unavailable.
