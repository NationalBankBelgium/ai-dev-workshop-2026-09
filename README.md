# AI development workshop · September 2026

Workshop app for the National Bank of Belgium AI Working Group. It proposes one of 200 small web-app ideas, gives each group a copyable starter prompt, and offers copyable follow-up prompts for a second act or a different creative angle.

The source data lives in [`app-ideas.json`](app-ideas.json). Zod validates it at the TypeScript data boundary and the same invariants are covered by unit tests. The source file contains the 170 extracted ideas plus 30 clearly noted workshop additions, with ten copy-ready additional prompts for every idea.

## Local development

Requires Node.js 22 (the same version used by CI and Pages).

```text
npm ci
npm run dev
```

Useful checks:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run verify-build
npm run generate:qr
```

The production build is deliberately a single self-contained `dist/index.html`; Vite inlines the TypeScript bundle, CSS, official NBB logo, local Barlow/Fraunces font files, and QR display artwork. The source remains split into typed modules for maintainability.

## Workshop behavior

- Step 1 explains the five-person group format and the build/test/evolve loop.
- Step 2 proposes a random idea and supports search, browsing, and changing the selection.
- Step 3 shows the starter prompt, ten named per-idea second-act prompts, and ten general Interesting modification prompts.
- “Show different ideas” rotates the second-act deck, while “Shuffle options” randomizes all ten angle prompts without a page refresh.
- The current step, selected idea, and deck positions are stored in namespaced `localStorage`.
- “Reset workshop” immediately clears that state and returns to Step 1.

The JSON uses structured prompt entries so the visible title and copied prompt stay separate:

```json
{
  "title": "Local save and reset",
  "prompt": "Modify the existing … app …"
}
```

The `additionalFeatures` entries are complete follow-up prompts. The general `interestingPrompts` entries are incremental modifications to an app that already exists; they are not alternate starter prompts.

## GitHub Pages release

The repository is intended to be [`NationalBankBelgium/ai-dev-workshop-2026-09`](https://github.com/NationalBankBelgium/ai-dev-workshop-2026-09). CI runs on pull requests and pushes to `main`. Pages deployment runs when a GitHub Release is published, and can also be started manually from Actions.

Before the first deployment, set the repository’s Pages source to **GitHub Actions**. The expected public URL is:

`https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/`

The publication handoff uses an HTTPS Git remote, one conventional launch commit, and an annotated `v1` tag. To roll back, publish/redeploy a prior known-good release through the same workflow.

## Workshop display and QR code

The app has a dedicated on-screen display at [`#qr-code`](https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/#qr-code). It shows the recommended workshop approach alongside a large QR code. From the app header, choose **Display QR + instructions** to open it without losing the current workshop session.

[![QR code for the AI development workshop](src/assets/workshop-url-qr.svg)](https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/)

The QR assets are kept in the repository for printing or reuse:

- [SVG QR code](src/assets/workshop-url-qr.svg)
- [PNG QR code](src/assets/workshop-url-qr.png)

Regenerate both assets after changing the public URL with `npm run generate:qr`.

## Data source

The original wording was extracted from the internal Confluence workshop page recorded in the `source` metadata of [`app-ideas.json`](app-ideas.json). The deployed app does not request Confluence or `nbb.be` at runtime.
