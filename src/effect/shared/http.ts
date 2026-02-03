import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema } from "@effect/platform";
import { Context, Ref, Schema } from "effect";
import { SessionMiddleware } from "../server/middleware/Session";
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationInfo,
  RegistrationResponseJSON,
} from "./webauthn";

export class WebAuthnApiError extends Schema.TaggedError<WebAuthnApiError>()(
  "WebAuthnApiError",
  {},
  HttpApiSchema.annotations({ status: 400 }),
) {}

class AuthGroup extends HttpApiGroup.make("auth")
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

export class KilnApi extends HttpApi.make("kiln")
  .add(ApiGroup)
  .add(AuthGroup).middleware(SessionMiddleware)
{}
