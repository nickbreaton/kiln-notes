import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema, Multipart } from "@effect/platform";
import { Context, Ref, Schema } from "effect";
import { SessionMiddleware } from "../server/middleware/Session";
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "./webauthn";

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

export class ImageUploadError extends Schema.TaggedError<ImageUploadError>()(
  "ImageUploadError",
  { cause: Schema.Unknown },
  HttpApiSchema.annotations({ status: 400 }),
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
      .setPayload(Schema.Struct({ stateVector: Schema.Uint8Array }))
      .addSuccess(Schema.Struct({ diff: Schema.Uint8Array, stateVector: Schema.Uint8Array }))
      .addError(UnauthorizedError)
      .addError(SyncServiceError),
  )
  .add(
    HttpApiEndpoint.post("push", "/api/sync/push")
      .setPayload(Schema.Struct({ diff: Schema.Uint8Array }))
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(UnauthorizedError)
      .addError(SyncServiceError),
  )
{}

export class ImageGroup extends HttpApiGroup.make("images")
  .add(
    HttpApiEndpoint.post("uploadImage", "/api/images/upload")
      .setPayload(HttpApiSchema.MultipartStream(Schema.Struct({
        id: Schema.String,
        image: Multipart.FileSchema,
      })))
      .addSuccess(Schema.Void)
      .addError(UnauthorizedError)
      .addError(ImageUploadError),
  )
{}

export class KilnApi extends HttpApi.make("kiln")
  .add(ApiGroup)
  .add(AuthGroup)
  .add(SyncGroup)
  .add(ImageGroup)
  .middleware(SessionMiddleware)
{}
