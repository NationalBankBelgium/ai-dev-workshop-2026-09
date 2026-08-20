# Agent and contributor notes

This repository contains the National Bank of Belgium AI development workshop app. It is a TypeScript/Vite single-page app that is built into one self-contained `dist/index.html` file and published on GitHub Pages.

## Start here

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the project. It contains the complete local development, build, test, and release workflow.

## Project conventions

- Keep the app usable as a static GitHub Pages site. Do not introduce a server-side runtime or a required network request for the workshop flow.
- Keep the source of the workshop ideas in `app-ideas.json`. The Zod schema in `src/config-schema.ts` validates the data before the app uses it.
- Keep TypeScript strict and run the quality commands in `CONTRIBUTING.md` before committing.
- Use conventional commits such as `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, and `chore: ...`.
- Preserve the NBB visual language: the official English NBB logo, NBB colours and fonts, and the blue accent line.
- Keep participant state in local storage and shared idea navigation in the URL hash/query parameters; do not make a refresh destructive.
- Facilitator mode is intended for a shared screen. Timer ticks must update the existing DOM in place rather than re-rendering the page.
- Prompts copied to the clipboard must not include the surrounding quotation marks displayed by the UI.
- When changing user-facing behaviour, update or add Playwright coverage in `e2e/workshop.spec.ts` and unit coverage where appropriate.

## Release reminder

Every version tag must have a corresponding published GitHub Release. The Pages workflow listens for the `release.published` event, then builds and deploys the site. See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact release steps and deployment verification.
