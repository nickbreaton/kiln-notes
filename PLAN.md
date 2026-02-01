# Kiln Notes Technical Plan

## Overview

This document tracks the technical implementation plan for migrating Kiln Notes to a Y.js-based architecture with passkey authentication. All APIs go through Effect for type-safe, composable error handling.

## Key Decisions (Avoid Re-researching)

### Authentication
- **Limited-user passkeys**: Support 1-2 users via environment variables (`USER_[N]=[name];[base64_passkey_json]`)
- No database storage for credentials, no user management UI
- Users configured manually via env vars, server restart required to add users

### Data Architecture
- **Y.js over LiveStore**: Better ecosystem, more documentation, proven CRDT implementation
- **Effect throughout**: All APIs must use Effect for consistency and error handling
- **Swappable layers**: Local and production environments use same business logic, different storage
- **One Durable Object per user**: Simplifies data isolation, scales horizontally
- **No collaboration**: Users only access their own isolated data

### WebSocket & Sync
- **WebSocket over HTTP**: Real-time sync requires persistent connection
- **Offline conflicts**: Use simplest approach. Very rare scenario (likely single device). Y.js mainly for offline sync capability.

### Image Handling
- **Image upload flow**: Client generates image ID, registers it with server first (via Y.js), then uploads
- Prevents orphaned images and makes cleanup easier
- Server periodically scans for orphaned images (images in storage but not referenced in Y.js)

### Storage Strategy
- **Client**: y-indexeddb for persistence (separate DB per user)
- **Local dev**: File-based storage (`./data/{userId}.yjs`)
- **Cloudflare**: Durable Object per user with SQLite persistence

## Environment Configuration

```bash
# .env
# Users configured via env vars (format: USER_[N]=[name];[base64_passkey_json])
USER_1="Alice;eyJpZCI6ImFiYzEyMyIs..."
USER_2="Bob;eyJpZCI6ImRlZjQ1NiIs..."
```

## Implementation Tasklist

### Phase 1: Passkey Authentication

- [ ] Add SimpleWebAuthn dependencies (`@simplewebauthn/browser`, `@simplewebauthn/server`)
- [ ] Create dev script to generate passkey and output credential JSON
- [ ] Implement server-side auth API:
  - [ ] Load credentials from env vars (`USER_[N]` pattern)
  - [ ] Generate authentication options endpoint (`POST /api/auth/options`)
  - [ ] Verify authentication response endpoint (`POST /api/auth/verify`)
  - [ ] Issue session tokens with userId
- [ ] Implement client-side auth service:
  - [ ] Login flow (get options → authenticate → verify → store token)
  - [ ] Logout flow
  - [ ] Session storage
- [ ] Add protected route guards
- [ ] Test auth flow locally

### Phase 2: Remove LiveStore

- [ ] Remove LiveStore dependencies (`@livestore/*`)
- [ ] Refactor `PieceRepository` to remove `SubscriptionRef`
- [ ] Prepare for Y.js integration (keep repo in working state)

### Phase 3: Y.js Core Setup

- [ ] Add Y.js dependencies (`y`, `y-indexeddb`, `y-websocket`)
- [ ] Create `YjsDocument` Effect service
- [ ] Implement y-indexeddb persistence (client-side, per user)
- [ ] Refactor `PieceRepository` to use Y.js:
  - [ ] Replace reactive streams with Y.js observables
  - [ ] Use Y.js transactions for state updates
  - [ ] Maintain same public API
- [ ] Test local-only Y.js flow

### Phase 4: Image Upload API

- [ ] Create image upload endpoints:
  - [ ] `POST /api/images/:imageId` - Upload image bytes (requires prior registration)
  - [ ] `GET /api/images/:imageId` - Download image
- [ ] Implement client-side image upload flow:
  - [ ] Generate image ID on client
  - [ ] Add to piece in Y.js (registers with server)
  - [ ] Upload image bytes after registration
- [ ] Implement orphaned image cleanup (periodic scan)

### Phase 5: Server Storage Backends

- [ ] Create `StorageBackend` abstraction (Effect interface)
- [ ] Implement Node.js backend (local dev):
  - [ ] File-based storage at `./data/{userId}.yjs`
  - [ ] Load/save Y.js state
- [ ] Implement Cloudflare Durable Object backend:
  - [ ] One DO per user (isolated by userId)
  - [ ] In-memory Y.Doc with SQLite persistence
  - [ ] Auto-save on Y.js updates
- [ ] Test both backends

### Phase 6: WebSocket Sync

- [ ] Create WebSocket transport abstraction
- [ ] Implement local WebSocket server:
  - [ ] Node.js WebSocket server (separate port or integrated)
  - [ ] Auth token validation on connection
- [ ] Implement Cloudflare WebSocket handling:
  - [ ] Durable Object WebSocket upgrade handling
  - [ ] WebSocket hibernation support
- [ ] Implement client WebSocket provider:
  - [ ] Connect with auth token
  - [ ] Reconnection handling
- [ ] Test sync between client and server

### Phase 7: Data Migration

- [ ] Create migration from localStorage to Y.js:
  - [ ] Check for existing localStorage data on first Y.js load
  - [ ] Convert pieces to Y.js map structure
  - [ ] Clear old localStorage keys after migration
- [ ] Test migration path

### Phase 8: Testing & Deployment

- [ ] Test complete local development flow
- [ ] Deploy to Cloudflare Pages
- [ ] Configure Durable Objects in wrangler.toml
- [ ] Test sync across devices
- [ ] Verify offline → online sync works

## Architecture Diagrams

### Auth Flow

```
Client                              Server
  |                                   |
  |-- POST /api/auth/options -------->|
  |<-- Challenge + allowCreds ---------|
  |                                   |
  |-- User authenticates (biometric)  |
  |                                   |
  |-- POST /api/auth/verify --------->|
  |     (signed response)             |
  |<-- Session token + userId ---------|
```

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
│  - WS server       │            │  - SQLite persistence  │
└────────────────────┘            └────────────────────────┘
```

## References

- **SimpleWebAuthn**: https://simplewebauthn.dev/docs/
- **Y.js**: https://docs.yjs.dev/
- **Effect**: https://effect.website/
- **Cloudflare Durable Objects**: https://developers.cloudflare.com/durable-objects/
- **WebAuthn Spec**: https://w3c.github.io/webauthn/

## Open Questions

- [ ] Do we need document versioning/backup?
- [ ] Migration path for existing users (if any)?
