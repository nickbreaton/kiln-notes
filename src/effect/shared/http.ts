import { Multipart } from "effect/unstable/http";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { Schema } from "effect";
import { ImageId } from "../schema";
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "./webauthn";

export class WebAuthnApiError extends Schema.TaggedErrorClass<WebAuthnApiError>()(
  "WebAuthnApiError",
  Schema.Struct({ cause: Schema.Unknown }).pipe(HttpApiSchema.status(400)),
) {}

export class UnauthorizedError extends Schema.TaggedErrorClass<UnauthorizedError>()(
  "UnauthorizedError",
  Schema.Struct({ message: Schema.String }).pipe(HttpApiSchema.status(401)),
) {}

export class SyncServiceError extends Schema.TaggedErrorClass<SyncServiceError>()(
  "SyncServiceError",
  Schema.Struct({ cause: Schema.Unknown }).pipe(HttpApiSchema.status(500)),
) {}

export class ImageUploadError extends Schema.TaggedErrorClass<ImageUploadError>()(
  "ImageUploadError",
  Schema.Struct({ cause: Schema.Unknown }).pipe(HttpApiSchema.status(400)),
) {}

export class AuthGroup extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.get("registerOptions", "/api/auth/register-options", {
      success: PublicKeyCredentialCreationOptionsJSON,
      error: WebAuthnApiError,
    }),
  ).add(
    HttpApiEndpoint.post("registerVerify", "/api/auth/register-verify", {
      payload: Schema.Struct({ response: RegistrationResponseJSON }),
      success: Schema.String,
      error: WebAuthnApiError,
    }),
  ).add(
    HttpApiEndpoint.get("authenticateOptions", "/api/auth/authenticate-options", {
      success: PublicKeyCredentialRequestOptionsJSON,
      error: WebAuthnApiError,
    }),
  ).add(
    HttpApiEndpoint.post("authenticateVerify", "/api/auth/authenticate-verify", {
      payload: Schema.Struct({ response: AuthenticationResponseJSON }),
      success: Schema.Struct({ verified: Schema.Boolean }),
      error: WebAuthnApiError,
    }),
  )
{}

export class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.String,
  timestamp: Schema.String,
}) {}

export class ApiGroup extends HttpApiGroup.make("api", { topLevel: true })
  .add(
    HttpApiEndpoint.get("health", "/api/health", {
      success: HealthResponse,
    }),
  )
{}

export class SyncGroup extends HttpApiGroup.make("sync")
  .add(
    HttpApiEndpoint.post("pull", "/api/sync/pull", {
      payload: Schema.Struct({ stateVector: Schema.Uint8Array }),
      success: Schema.Struct({ diff: Schema.Uint8Array, stateVector: Schema.Uint8Array }),
      error: [UnauthorizedError, SyncServiceError],
    }),
  )
  .add(
    HttpApiEndpoint.post("push", "/api/sync/push", {
      payload: Schema.Struct({ diff: Schema.Uint8Array }),
      success: Schema.Struct({ success: Schema.Boolean }),
      error: [UnauthorizedError, SyncServiceError],
    }),
  )
{}

export class ImageNotFoundError extends Schema.TaggedErrorClass<ImageNotFoundError>()(
  "ImageNotFoundError",
  Schema.Struct({ message: Schema.String }).pipe(HttpApiSchema.status(404)),
) {}

export const ImageVariant = Schema.Literals(["full", "thumbnail"]);

export class ImageGroup extends HttpApiGroup.make("images")
  .add(
    HttpApiEndpoint.post("uploadImage", "/api/images/upload", {
      payload: Schema.Struct({
        id: ImageId,
        "full-content-length": Schema.String,
        "thumbnail-content-length": Schema.String,
        full: Multipart.SingleFileSchema,
        thumbnail: Multipart.SingleFileSchema,
      }).pipe(HttpApiSchema.asMultipartStream()),
      success: Schema.Struct({ success: Schema.Boolean }),
      error: [UnauthorizedError, ImageUploadError],
    }),
  )
  .add(
    HttpApiEndpoint.get("getImage", "/api/image/:id/:variant", {
      params: Schema.Struct({ id: ImageId, variant: ImageVariant }),
      error: [UnauthorizedError, ImageNotFoundError],
    }),
  )
{}

export class KilnApi extends HttpApi.make("kiln")
  .add(ApiGroup)
  .add(AuthGroup)
  .add(SyncGroup)
  .add(ImageGroup)
{}
