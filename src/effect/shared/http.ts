import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
  VerifiedRegistrationResponse,
} from "./authn";

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

// Define the API group (topLevel: true means no group prefix)
export class ApiGroup extends HttpApiGroup.make("api", { topLevel: true })
  .add(HttpApiEndpoint.get("health", "/api/health").addSuccess(HealthResponse))
  .add(
    HttpApiEndpoint.get("register-options", "/api/auth/register-options")
      .addSuccess(PublicKeyCredentialCreationOptionsJSON)
      .addError(WebAuthnApiError),
  )
  .add(
    HttpApiEndpoint.post("register-verify", "/api/auth/register-verify")
      .setPayload(Schema.Struct({ response: RegistrationResponseJSON, userId: Schema.String }))
      .addSuccess(VerifiedRegistrationResponse)
      .addError(WebAuthnApiError),
  )
{}

// Define the API
export class KilnApi extends HttpApi.make("kiln").add(ApiGroup) {}
