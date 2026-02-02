import { HttpApiBuilder, HttpServer } from "@effect/platform";
import type { APIRoute } from "astro";
import { Effect, Layer } from "effect";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import { HealthResponse, KilnApi, WebAuthnApiError } from "../../effect/shared/http";

// =============================================================================
// SERVER IMPLEMENTATION
// =============================================================================

// Create the group handlers layer (provides the actual endpoint implementations)
const ApiGroupLive = HttpApiBuilder.group(KilnApi, "api", (handlers) =>
  handlers
    .handle("health", () =>
      Effect.succeed(
        new HealthResponse({ status: "ok", timestamp: new Date().toISOString() }),
      ))
    .handle("register-options", () =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.generateRegistrationOptions;
      }).pipe(Effect.mapError(() => new WebAuthnApiError())))
    .handle("register-verify", ({ payload }) =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.verifyRegistrationResponse(payload);
      }).pipe(Effect.mapError(() => new WebAuthnApiError()))));

// Create the API layer and provide the group implementations
const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(
  Layer.provide(ApiGroupLive),
  Layer.provide(WebAuthnService.Default),
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
