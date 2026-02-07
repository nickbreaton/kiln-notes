# Authentication System Architecture

This document describes how passkey authentication works in the Kiln Notes application.

## System Diagram

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        UI[Auth Component\n(Auth.tsx)]
        State[Effect Atoms\n(atom.ts)]
        ClientService[WebAuthnClientService\n(WebAuthnClientService.ts)]
        BrowserAPI[@simplewebauthn/browser]
        UserService[UserService\n(UserService.ts)]
        CookieStore[CookieStore API]
    end

    subgraph Server["Server (Cloudflare/Astro)"]
        API[API Endpoints\n(http.ts)]
        Handlers[Route Handlers\n([...path].ts)]
        WebAuthnService[WebAuthnService\n(WebAuthnService.ts)]
        ServerAPI[@simplewebauthn/server]
        Session[Session Middleware\n(Session.ts)]
        UserStore[UserService\n(UserService.ts)]
        IronSession[iron-session]
        RelayingParty[RelayingPartyService]
    end

    subgraph Storage["Storage"]
        EnvVars[Environment Variables\nUSERS, PASSKEY_*]
        SessionCookie[(Session Cookie\niron-session)]
        UserCookie[(User Cookie\n1 year expiry)]
    end

    %% Registration Flow
    UI -->|"Click 'Create passkey'"| State
    State -->|"registerPasskeyAtom"| ClientService
    ClientService -->|"GET /api/auth/register-options"| API
    API -->|"Generate options"| WebAuthnService
    WebAuthnService -->|"Generate challenge"| ServerAPI
    ServerAPI -->|"Return options"| WebAuthnService
    WebAuthnService -->|"Store challenge"| Session
    Session -->|"Save challenge"| IronSession
    IronSession -->|"Set cookie"| SessionCookie
    API -->|"Return options"| ClientService
    ClientService -->|"Start registration"| BrowserAPI
    BrowserAPI -->|"Prompt biometric/device auth"| UserDevice["User Device\n(Biometric/Security Key)"]
    UserDevice -->|"Return credential"| BrowserAPI
    BrowserAPI -->|"Return response"| ClientService
    ClientService -->|"POST /api/auth/register-verify"| API
    API -->|"Verify registration"| WebAuthnService
    WebAuthnService -->|"Verify response"| ServerAPI
    ServerAPI -->|"Return registration info"| WebAuthnService
    WebAuthnService -->|"Return base64 credential"| API
    API -->|"Return credential string"| ClientService
    ClientService -->|"Registration success"| State
    State -->|"Show credential code"| UI

    %% Authentication Flow
    UI -->|"Click 'Sign in'"| State
    State -->|"authenticatePasskeyAtom"| ClientService
    ClientService -->|"GET /api/auth/authenticate-options"| API
    API -->|"Generate options"| WebAuthnService
    WebAuthnService -->|"Generate challenge"| ServerAPI
    ServerAPI -->|"Return options"| WebAuthnService
    WebAuthnService -->|"Store challenge"| Session
    Session -->|"Save challenge"| IronSession
    API -->|"Return options"| ClientService
    ClientService -->|"Start authentication"| BrowserAPI
    BrowserAPI -->|"Prompt for passkey"| UserDevice
    UserDevice -->|"Sign challenge"| BrowserAPI
    BrowserAPI -->|"Return assertion"| ClientService
    ClientService -->|"POST /api/auth/authenticate-verify"| API
    API -->|"Verify authentication"| Handlers
    Handlers -->|"Find matching passkey"| UserStore
    UserStore -->|"Load stored passkeys"| EnvVars
    Handlers -->|"Verify assertion"| WebAuthnService
    WebAuthnService -->|"Verify response"| ServerAPI
    ServerAPI -->|"Return verified"| WebAuthnService
    WebAuthnService -->|"Set user in session"| Session
    Session -->|"Save session"| IronSession
    Session -->|"Set user cookie"| UserCookie
    API -->|"Return {verified: true}"| ClientService
    ClientService -->|"Auth success"| State
    State -->|"Update UI"| UI

    %% User Detection Flow
    UserCookie -->|"Cookie change event"| CookieStore
    CookieStore -->|"Stream updates"| UserService
    UserService -->|"Map to Option"| State
    State -->|"userAtom value"| UI

    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef server fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef storage fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    class UI,State,ClientService,BrowserAPI,UserService,CookieStore client
    class API,Handlers,WebAuthnService,ServerAPI,Session,UserStore,IronSession,RelayingParty server
    class EnvVars,SessionCookie,UserCookie storage
    class UserDevice external
```

## Component Overview


### Registration Flow

1. User clicks "Create passkey" in the Auth component
2. Client requests registration options from server (`GET /api/auth/register-options`)
3. Server generates a challenge and stores it in the session
4. Browser prompts user for biometric/device authentication
5. Device generates a credential and returns it to the browser
6. Client sends the registration response to server (`POST /api/auth/register-verify`)
7. Server verifies the response and returns a base64-encoded credential string
8. User copies this credential code to share with an administrator
9. Administrator adds the credential to the `PASSKEY_<user>` environment variable

### Authentication Flow

1. User clicks "Sign in with passkey"
2. Client requests authentication options from server (`GET /api/auth/authenticate-options`)
3. Server generates a challenge and stores it in the session
4. Browser prompts user to select and authenticate with their passkey
5. Device signs the challenge and returns the assertion
6. Client sends the authentication response to server (`POST /api/auth/authenticate-verify`)
7. Server finds the matching passkey and verifies the signature
8. On successful verification, server sets the `user` in session and a persistent user cookie
9. Client detects the cookie change via CookieStore API and updates the UI to show logged-in state

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
