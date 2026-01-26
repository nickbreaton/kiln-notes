# AGENTS.md

## Project overview
- Pottery piece tracking PWA: users upload pieces and track status.
- UX: gallery view (Apple Photos-like) grouped by status section headers; vertical kanban-style flow; persistent top toolbar.
- Mobile-first; desktop is secondary for early stage.
- Local-first app: always save data back to server, while keeping the app responsive in low-signal/offline conditions.

## Status model
- Statuses are flexible; initial set: Drying, Bisquing, Glazed, Complete.

## Tech stack
- Client: React + Effect + Effect Atom + LiveStore + Tailwind.
- Server: Astro API endpoints; single Astro route serves HTML with one top-level React component.
- Deployment: Cloudflare.
- Auth: passkeys.

## Dev commands (bun only)
- Install deps: `bun install`
- Start dev server: `bun dev`
- Build: `bun build`
- Preview build: `bun preview`

## Agent guidance
- Use bun commands only (no npm).
- Check for project skills when working with unfamiliar tech (e.g., LiveStore, Effect).
- Use the LiveStore skill when touching LiveStore code.
- Depend on LiveStore for local-first tasks.

## Design
- Design is being complete in Pencil.dev via Pencil MCP and rule.
- When modifying the pencil, we should be sure to keep the Tailwind color palette in sync in @src/styles/global.css.
