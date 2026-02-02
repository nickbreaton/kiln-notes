import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "./authn";

// Define schemas
export class HealthResponse extends Schema.Class<HealthResponse>("HealthResponse")({
  status: Schema.String,
  timestamp: Schema.String,
}) {}

// WebAuthn API error
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
      .setPayload(Schema.Struct({ response: RegistrationResponseJSON, userId: Schema.String }))
      .addSuccess(Schema.Struct({ registrationInfo: Schema.String }))
      .addError(WebAuthnApiError),
  )
{}

// Define the API group
export class ApiGroup extends HttpApiGroup.make("api", { topLevel: true })
  .add(HttpApiEndpoint.get("health", "/api/health").addSuccess(HealthResponse))
{}

// Extend the HttpApiMiddleware.Tag class to define the logger middleware tag
export class CookieStoreMiddleware
  extends HttpApiMiddleware.Tag<CookieStoreMiddleware>()("CookieStoreMiddleware", {})
{}

// Define the API
export class KilnApi extends HttpApi.make("kiln").add(ApiGroup).add(AuthGroup).middleware(CookieStoreMiddleware) {}
