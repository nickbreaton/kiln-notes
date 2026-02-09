import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema } from "@effect/platform";
import { Context, Ref, Schema } from "effect";
import { SessionMiddleware } from "../server/middleware/Session";
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "./webauthn";
import { YjsUpdate } from "./YjsSchema";

export class WebAuthnApiError extends Schema.TaggedError<WebAuthnApiError>()(
  "WebAuthnApiError",
  { cause: Schema.Unknown },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
  "UnauthorizedError",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class SyncServiceError extends Schema.TaggedError<SyncServiceError>()(
  "SyncServiceError",
  { cause: Schema.Unknown },
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class AuthGroup extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.get("registerOptions", "/api/auth/register-options")
      .addSuccess(PublicKeyCredentialCreationOptionsJSON)
      .addError(WebAuthnApiError),
  ).add(
    HttpApiEndpoint.post("registerVerify", "/api/auth/register-verify")
      .setPayload(Schema.Struct({ response: RegistrationResponseJSON }))
      .addSuccess(Schema.String)
      .addError(WebAuthnApiError),
  ).add(
    HttpApiEndpoint.get("authenticateOptions", "/api/auth/authenticate-options")
      .addSuccess(PublicKeyCredentialRequestOptionsJSON)
      .addError(WebAuthnApiError),
  ).add(
    HttpApiEndpoint.post("authenticateVerify", "/api/auth/authenticate-verify")
      .setPayload(Schema.Struct({ response: AuthenticationResponseJSON }))
      .addSuccess(Schema.Struct({ verified: Schema.Boolean }))
      .addError(WebAuthnApiError),
  )
{}

export class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.String,
  timestamp: Schema.String,
}) {}

export class ApiGroup extends HttpApiGroup.make("api", { topLevel: true })
  .add(
    HttpApiEndpoint.get("health", "/api/health")
      .addSuccess(HealthResponse),
  )
{}

export class SyncGroup extends HttpApiGroup.make("sync")
  .add(
    HttpApiEndpoint.post("pull", "/api/sync/pull")
      // State vector is optional base64-encoded; omitted for initial sync
      .setPayload(Schema.Struct({ stateVector: Schema.Option(Schema.String) }))
      // Response contains Yjs update and server's current state vector
      .addSuccess(Schema.Struct({
        update: YjsUpdate,
        serverStateVector: Schema.Option(Schema.String),
      }))
      .addError(UnauthorizedError)
      .addError(SyncServiceError),
  )
  .add(
    HttpApiEndpoint.post("push", "/api/sync/push")
      // Request body contains Yjs update as Uint8Array (encoded as base64 on wire)
      .setPayload(Schema.Struct({ update: YjsUpdate }))
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(UnauthorizedError)
      .addError(SyncServiceError),
  )
{}

export class KilnApi extends HttpApi.make("kiln")
  .add(ApiGroup)
  .add(AuthGroup)
  .add(SyncGroup)
  .middleware(SessionMiddleware)
{}
