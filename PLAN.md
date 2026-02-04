# Kiln Notes Technical Plan

## Overview

This document tracks the technical implementation plan for Kiln Notes Y.js-based architecture. All APIs go through Effect for type-safe, composable error handling.

## Key Decisions (Avoid Re-researching)

### Data Architecture

- **Y.js over LiveStore**: Better ecosystem, more documentation, proven CRDT implementation
- **Effect throughout**: All APIs must use Effect for consistency and error handling
- **Swappable layers**: Local and production environments use same business logic, different storage
- **One Durable Object per user**: Simplifies data isolation, scales horizontally
- **No collaboration**: Users only access their own isolated data

### WebSocket & Sync

- **WebSocket over HTTP**: Real-time sync requires persistent connection
- **Hibernatable WebSockets**: Use CF's hibernation API—clients stay connected while DO sleeps, no billing during idle
- **Offline conflicts**: Use simplest approach. Very rare scenario (likely single device). Y.js mainly for offline sync capability.

### Image Handling

- **Image upload flow**: Client generates image ID, registers it with server first (via Y.js), then uploads
- Prevents orphaned images and makes cleanup easier
- Server periodically scans for orphaned images (images in storage but not referenced in Y.js)
- **Production storage**: R2 for images (DO storage has 128KB limit per key)

### Storage Strategy

- **Client**: y-indexeddb for persistence (separate DB per user)
- **Local dev**: File-based storage (`./data/{userId}.yjs`)
- **Cloudflare**: Durable Object per user using Durable Object storage (no SQL required)

## Implementation Tasklist

### Phase 1: Remove LiveStore

- [x] Remove LiveStore dependencies (`@livestore/*`)
- [x] Remove LiveStore references from AGENTS.md
- [x] Drop LiveStore WIP git stash

### Phase 2: Y.js Core Setup

- [ ] Add Y.js dependencies (`yjs`, `y-indexeddb`, `y-websocket`)
- [ ] Create `YjsDocument` Effect service
- [ ] Implement y-indexeddb persistence (client-side, per user)
- [ ] Refactor `PieceRepository` to use Y.js:
  - [ ] Replace reactive streams with Y.js observables
  - [ ] Use Y.js transactions for state updates
  - [ ] Maintain same public API
- [ ] Test local-only Y.js flow

### Phase 3: Image Upload API

- [ ] Create image upload endpoints:
  - [ ] `POST /api/images/:imageId` - Upload image bytes (requires prior registration)
  - [ ] `GET /api/images/:imageId` - Download image
- [ ] Implement client-side image upload flow:
  - [ ] Generate image ID on client
  - [ ] Add to piece in Y.js (registers with server)
  - [ ] Upload image bytes after registration
- [ ] Implement orphaned image cleanup (periodic scan)

### Phase 4: Server Storage Backends

- [ ] Create `StorageBackend` abstraction (Effect interface)
- [ ] Implement Node.js backend (local dev):
  - [ ] File-based storage at `./data/{userId}.yjs`
  - [ ] Load/save Y.js state
- [ ] Implement Cloudflare Durable Object backend:
  - [ ] One DO per user (isolated by userId)
  - [ ] In-memory Y.Doc with Durable Object storage persistence
  - [ ] Auto-save on Y.js updates
- [ ] Test both backends

### Phase 5: WebSocket Sync

- [ ] Create WebSocket transport abstraction
- [ ] Implement local WebSocket server:
  - [ ] Node.js WebSocket server (separate port or integrated)
  - [ ] Session cookie validation on connection
- [ ] Implement Cloudflare WebSocket handling:
  - [ ] Durable Object WebSocket upgrade handling
  - [ ] WebSocket hibernation support
- [ ] Implement client WebSocket provider:
  - [ ] Connect using same-origin cookies
  - [ ] Reconnection handling
- [ ] Test sync between client and server

### Phase 6: Data Migration

- [ ] Create migration from localStorage to Y.js:
  - [ ] Check for existing localStorage data on first Y.js load
  - [ ] Convert pieces to Y.js map structure
  - [ ] Clear old localStorage keys after migration
- [ ] Test migration path

### Phase 7: Testing & Deployment

- [ ] Test complete local development flow
- [ ] Deploy to Cloudflare Pages
- [ ] Configure Durable Objects in wrangler.toml
- [ ] Test sync across devices
- [ ] Verify offline → online sync works

## Architecture Diagrams

### Image Upload Flow

```
Client                              Server
  |                                   |
  |-- Create piece with image ID ----->|
  |     (Y.js update)                 |
  |<-- Acknowledge (Y.js sync) --------|
  |                                   |
  |-- POST /api/images/:id ---------->|
  |     (upload image bytes)          |
  |<-- 200 OK (or 404 if unregistered)|
```

### Y.js Sync Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   React UI   │  │ Effect Atom  │  │   Y.js Doc   │  │   y-indexeddb    │  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  └──────────────────┘  │
│                           │                                 │
│                         WebSocket                            │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────────┐            ┌─────────────▼──────────┐
│   LOCAL DEV        │            │   CLOUDFLARE           │
│   (Node.js)        │            │                        │
│  - File storage    │            │  - Durable Object      │
│  - WS server       │            │  - DO storage + R2     │
└────────────────────┘            └────────────────────────┘
```

## References

- **Y.js**: https://docs.yjs.dev/
- **Effect**: https://effect.website/
- **Cloudflare Durable Objects**: https://developers.cloudflare.com/durable-objects/
- **WebAuthn Spec**: https://w3c.github.io/webauthn/

## Open Questions

- [ ] Do we need document versioning/backup?
- [ ] Migration path for existing users (if any)?
- [ ] Image storage in prod: Durable Object storage vs R2 (and retention/cost constraints)?
- [ ] Offline image capture + upload queue: what UX do we want for "pending uploads" and failure/retry?
