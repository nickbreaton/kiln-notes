# AGENTS.md

## Project overview

- Pottery piece tracking PWA: users upload pieces and track status.
- UX: gallery view (Apple Photos-like) grouped by status section headers; vertical kanban-style flow; persistent top toolbar.
- Mobile-first; desktop is secondary for early stage.
- Local-first app: always save data back to server, while keeping the app responsive in low-signal/offline conditions.

## Status model

- Statuses are flexible; initial set: Drying, Bisquing, Glazed, Complete.

## Tech stack

- Client: React + Effect + Effect Atom + Tailwind.
- Server: Astro API endpoints; single Astro route serves HTML with one top-level React component.
- Deployment: Cloudflare.
- Auth: passkeys.

## Dev commands (bun only)

- Install deps: `bun install`
- Start dev server: `bun dev`
- Build: `bun run build`
- Preview build: `bun preview`

## Agent guidance

- Use bun commands only (no npm).
- Check for project skills / subagents when working with unfamiliar tech (e.g., Effect).
- If working in Effect code (likely), do not "break out" of it and start writing vanilla JavaScript when running into problems, instead do more research to find a solution within the Effect ecosystem.
- Prefer `Schema.decodeUnknown(...)` over `Schema.decodeUnknownEither(...)` and `Schema.decodeUnknownOption(...)` to keep decoding in the Effect workflow.
- Do not run the development server (`bun dev` / `bun astro dev`) since it is most likely being run by the user.
- Do not run `bun run build` unless instructed to. Doing this takes time and eats context.

## Design

- Design is being complete in Pencil.dev via Pencil MCP and rule.
- When modifying the pencil, we should be sure to keep the Tailwind color palette in sync in @src/styles/global.css.
- Buttons should be sentence cased: "Back to sign in" instead of "Back to Sign In"
- Do not escape Tailwind classes with custom values unless absolutely necessary: "mt-5" instead of "mt-[21px]".
