# Authentication System Architecture

This document describes how passkey authentication works in the Kiln Notes application.

## System Overview

```mermaid
flowchart LR
    Browser["Browser<br/>React + Effect"] -->|"HTTP / WebAuthn"| Server["Server<br/>Astro + Cloudflare"]
    Server -->|"iron-session"| Session[("Session Store")]
    Server -->|"Env vars"| Storage[("Passkey Storage")]
    Browser <-->|"WebAuthn API"| Device["Device<br/>Biometric/Security Key"]

    style Browser fill:#e3f2fd,stroke:#1976d2
    style Server fill:#f3e5f5,stroke:#7b1fa2
    style Session fill:#fff3e0,stroke:#e65100
    style Storage fill:#fff3e0,stroke:#e65100
    style Device fill:#e8f5e9,stroke:#388e3c
```

## Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Auth UI
    participant CS as WebAuthnClient
    participant API as Server API
    participant WS as WebAuthnService
    participant Sess as Session

    U->>UI: Click "Create passkey"
    UI->>CS: registerPasskeyAtom
    CS->>API: GET /api/auth/register-options
    API->>WS: Generate options
    WS->>Sess: Store challenge
    API-->>CS: Return options
    CS->>U: Prompt biometric
    U-->>CS: Return credential
    CS->>API: POST /api/auth/register-verify
    API->>WS: Verify registration
    WS-->>API: Return base64 credential
    API-->>CS: Return credential string
    CS-->>UI: Show credential code
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Auth UI
    participant CS as WebAuthnClient
    participant API as Server API
    participant WS as WebAuthnService
    participant US as UserService
    participant Sess as Session
    participant Store as Passkey Store

    U->>UI: Click "Sign in"
    UI->>CS: authenticatePasskeyAtom
    CS->>API: GET /api/auth/authenticate-options
    API->>WS: Generate options
    WS->>Sess: Store challenge
    API-->>CS: Return options
    CS->>U: Prompt for passkey
    U-->>CS: Return assertion
    CS->>API: POST /api/auth/authenticate-verify
    API->>US: Find matching passkey
    US->>Store: Load stored passkeys
    API->>WS: Verify assertion
    WS-->>API: Return verified
    API->>Sess: Set user in session
    API-->>CS: Return {verified: true}
    CS-->>UI: Auth success
```

## Session Detection Flow

```mermaid
flowchart LR
    Cookie[("User Cookie")] -->|"change event"| Store["CookieStore API"]
    Store -->|"stream"| UserSvc["UserService"]
    UserSvc -->|"userAtom"| State["Effect Atoms"]
    State -->|"reactive"| UI["Auth UI"]

    style Cookie fill:#fff3e0,stroke:#e65100
    style Store fill:#e3f2fd,stroke:#1976d2
    style UserSvc fill:#e3f2fd,stroke:#1976d2
    style State fill:#e3f2fd,stroke:#1976d2
    style UI fill:#e3f2fd,stroke:#1976d2
```

## Storage & Sessions

- **User/Passkey Storage**: Credentials are stored in environment variables (`PASSKEY_<user>`)
- **Session**: Uses `iron-session` for secure, encrypted session cookies (temporary challenge storage)
- **User Cookie**: A persistent cookie with 1-year expiry tracks logged-in state
- **Detection**: Client uses the CookieStore API to reactively detect authentication state changes

## Security Considerations

- Sessions are encrypted with a secret (`SESSION_SECRET`)
- Cookies use `sameSite: strict` and `secure: true` settings
- WebAuthn provides phishing-resistant authentication
- Credentials are backed up by the user's authenticator (device-dependent)
