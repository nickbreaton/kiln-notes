---
name: livestore
description: Build apps with LiveStore (local-first, event-sourced SQLite state). Use this skill when defining LiveStore schemas, adapters, queries, syncing, or debugging/devtools workflows.
license: MIT
compatibility: opencode
metadata:
  docs: https://docs.livestore.dev/
  llms_full: https://docs.livestore.dev/llms-full.txt
---

# LiveStore

LiveStore is a client-centric, local-first data layer built around event sourcing and a reactive SQLite read model. Use this skill to design schemas, connect platform adapters, run queries, and integrate syncing providers.

## When to Use

- You are defining or refactoring LiveStore schemas (events, tables, materializers).
- You need to wire LiveStore into React/Vue/Solid, web/expo/node adapters, or a sync backend.
- You are debugging reactivity, syncing conflicts, or devtools workflows.

## Research Strategy

Always check the LiveStore docs first (they are evolving):

1) Full docs for fast lookup
- https://docs.livestore.dev/llms-full.txt

2) Targeted docs pages
- https://docs.livestore.dev/reference/concepts/
- https://docs.livestore.dev/reference/store/
- https://docs.livestore.dev/reference/events/
- https://docs.livestore.dev/reference/state/materializers/
- https://docs.livestore.dev/reference/state/sqlite/
- https://docs.livestore.dev/reference/syncing/
- https://docs.livestore.dev/reference/devtools/

3) Source code questions
Use the project tool:

```bash
btca ask -t livestore -q "<your question>"
```

If you are using Effect APIs in LiveStore, also load the global Effect skill.

## Core Mental Model

- Event sourcing is the write model: all changes are immutable events.
- SQLite tables are the read model: materialized state for fast synchronous queries.
- Materializers project events into SQLite tables.
- Sync replicates eventlogs between clients (push/pull with rebase, Git-style).

## Core API Patterns

### Schema definition

Use `Events.*` to define event schemas, and `State.SQLite.*` for tables and materializers.

Typical pattern:

```ts
import { Events, Schema, State, makeSchema } from '@livestore/livestore'

const eventA = Events.synced({
  name: 'v1.EventA',
  schema: Schema.Struct({ id: Schema.String })
})

const table = State.SQLite.table({
  name: 'items',
  columns: { id: State.SQLite.text({ primaryKey: true }) }
})

const materializers = State.SQLite.materializers({ eventA }, {
  eventA: ({ id }) => table.insert({ id })
})

const state = State.SQLite.makeState({ tables: { table }, materializers })
export const schema = makeSchema({ events: { eventA }, state })
```

Guidance:
- Keep event names versioned (`v1.*`) so you can evolve the write model.
- Keep eventlogs self-sufficient; avoid hard dependencies across stores.
- Split into multiple stores when data grows large or has distinct access control.

### Store creation

Node example (minimal):

```ts
import { makeAdapter } from '@livestore/adapter-node'
import { createStorePromise } from '@livestore/livestore'

const adapter = makeAdapter({ storage: { type: 'fs' } })
const store = await createStorePromise({ adapter, schema })
```

Notes:
- There is also an Effect-based API (`createStore`) for Effect users.

### Queries and reactivity

React:

```ts
import { LiveStoreProvider, useStore, useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
```

Guidance:
- Define queries with `queryDb`, then read with `useQuery`.
- Ensure `queryDb(..., { deps: [...] })` includes reactive dependencies.
- Keep queries in a separate module for readability and reuse.

### Adapters

- Web: `@livestore/adapter-web`
- Expo: `@livestore/adapter-expo`
- Node: `@livestore/adapter-node`

Choose the adapter for your runtime and configure persistence/sync there.

### Syncing

- Providers: `@livestore/sync-cf`, `@livestore/sync-electric`
- Sync backends enforce a global event order and broadcast new events.
- Default conflict resolution is last-write-wins; custom strategies are supported.

## Debugging and Devtools

- Devtools packages: `@livestore/devtools-vite`, `@livestore/devtools-expo`.
- Web devtools typically at `http://localhost:60000/_livestore`.
- Expo devtools: in terminal `shift + m` then select LiveStore Devtools.

Use devtools to inspect SQLite state, replay/execute events, and review performance.

## Migrations and Versioning

- Version event names to evolve the write model (`v1.*`, `v2.*`).
- Read model can be updated independently via materializers and schema changes.
- Storage format changes are a breaking change surface (`liveStoreStorageFormatVersion`).

## Anti-Patterns

- Do not model everything in a single store if data has distinct access control or scale needs.
- Do not forget to version event names; it blocks safe evolution.
- Do not define queries inline everywhere; it makes reactivity dependencies harder to manage.
- Do not bypass materializers; all state must be derived from events.

## Quick Checklist

- Events defined and versioned
- Tables defined and indexed for query patterns
- Materializers cover all events
- Adapter matches runtime
- Queries declared with proper deps
- Sync configured if needed
- Devtools wired for debugging
