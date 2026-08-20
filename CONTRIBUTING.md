# Contributing

Thanks for helping improve the AI development workshop app.

## Prerequisites

- Node.js 22.13 or newer supported release
- npm
- Chromium for Playwright end-to-end tests
- Git with access to the HTTPS GitHub remote

## Set up locally

```powershell
git clone https://github.com/NationalBankBelgium/ai-dev-workshop-2026-09.git
cd ai-dev-workshop-2026-09
npm ci
npx playwright install chromium
```

## Develop

Start the Vite development server:

```powershell
npm run dev
```

Open the local URL printed by Vite. The app is a client-side static site; changes to TypeScript, styles, and the JSON configuration are reflected by Vite's development server.

To preview the production build locally:

```powershell
npm run build
npm run preview
```

## Build, test, and validate

Run the full quality gate before committing:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run verify-build
npm run test:e2e
```

The end-to-end tests start the app through Playwright and require Chromium. `npm run verify-build` confirms that the generated `dist/index.html` is self-contained for GitHub Pages.

Useful individual commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create the single-file production site |
| `npm run lint` | Run ESLint with no warnings allowed |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run verify-build` | Validate the self-contained build artifact |
| `npm run generate:qr` | Regenerate the workshop QR assets when the public URL changes |
| `npm run migrate-prompts` | Apply the prompt migration script when the JSON model changes |

## Where to make changes

- `app-ideas.json`: workshop app ideas and their prompts.
- `src/config-schema.ts`: the Zod schema for the JSON configuration.
- `src/data.ts` and `src/model.ts`: typed configuration loading and domain types.
- `src/app.ts`: application state, rendering, interactions, sharing, and facilitator mode.
- `src/styles.css`: NBB-themed layout and responsive UI.
- `e2e/workshop.spec.ts` and `tests/`: automated browser and unit coverage.
- `.github/workflows/ci.yml`: quality gates.
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment.

Keep the generated `dist/` directory out of commits. The Pages workflow builds it from the tagged source.

## Commit and pull request guidelines

Use a conventional commit message with a short imperative description:

```text
feat: add ...
fix: correct ...
test: cover ...
docs: document ...
chore: update ...
```

Keep commits focused. Include tests for changed behaviour and describe any user-facing change in the pull request.

## Release and deployment

Releases are made from `main`. The published GitHub Release is the deployment trigger, so every version tag must also have a GitHub Release.

1. Make sure the worktree is clean, the intended commits are on `main`, and the full quality gate passes.
2. Push `main` using the HTTPS remote:

   ```powershell
   git push origin main
   ```

3. Create and push the next version tag. Use the repository's existing version convention, for example:

   ```powershell
   git tag -a v4 -m "Release v4"
   git push origin v4
   ```

4. Create and publish a GitHub Release for that exact tag. With GitHub CLI:

   ```powershell
   gh release create v4 --repo NationalBankBelgium/ai-dev-workshop-2026-09 --title "v4" --generate-notes
   ```

   Alternatively, open the repository's GitHub Releases page, choose **Draft a new release**, select the pushed tag, and publish it.

5. Confirm that the `Deploy GitHub Pages` workflow ran successfully for the published release. The live site is:

   `https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/`

To roll back a static deployment, publish a GitHub Release for a known-good existing tag and verify the resulting Pages deployment. Do not force-push `main` or tags.
