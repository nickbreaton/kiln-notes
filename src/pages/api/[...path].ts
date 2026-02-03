import { HttpApiBuilder, HttpServer } from "@effect/platform";
import type { APIRoute } from "astro";
import { ConfigProvider, Effect, Layer, Schema } from "effect";
import { SessionMiddlewareLive } from "../../effect/server/middleware/Session";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import { HealthResponse, KilnApi, WebAuthnApiError } from "../../effect/shared/http";

// =============================================================================
// SERVER IMPLEMENTATION
// =============================================================================

// Create the "api" group handler (health endpoint)
const ApiGroupLive = HttpApiBuilder.group(KilnApi, "api", (handlers) =>
  handlers.handle("health", () => {
    return Effect.succeed(new HealthResponse({ status: "ok", timestamp: new Date().toISOString() }));
  }));

// Create the "auth" group handler (WebAuthn endpoints)
const AuthGroupLive = HttpApiBuilder.group(KilnApi, "auth", (handlers) =>
  handlers
    .handle("registerOptions", () =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.generateRegistrationOptions;
      }).pipe(Effect.mapError(() => new WebAuthnApiError())))
    .handle("registerVerify", ({ payload }) =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        const registrationInfo = yield* webAuthnService.verifyRegistrationResponse(payload);

        // @effect-diagnostics-next-line preferSchemaOverJson:off -- no backing schema
        const encodedRegistrationInfo = yield* Schema.encode(Schema.StringFromBase64)(JSON.stringify(registrationInfo));

        return { registrationInfo: encodedRegistrationInfo };
      }).pipe(Effect.mapError(() => new WebAuthnApiError()))));

// Create the API layer and provide the group implementations
const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(
  Layer.provide(ApiGroupLive),
  Layer.provide(AuthGroupLive),
  Layer.provide(WebAuthnService.Default),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env))),
);

// Merge with HttpServer.layerContext for toWebHandler
const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLayer, HttpServer.layerContext),
);

// =============================================================================
// ASTRO API ROUTE
// =============================================================================

// Server-rendered API route - no static paths needed
export const prerender = false;

// Handle all HTTP methods with the Effect router
export const ALL: APIRoute = async ({ request }) => handler(request);
