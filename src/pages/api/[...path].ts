import { HttpApiBuilder, HttpServer } from "@effect/platform";
import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { Effect, Layer } from "effect";
import { AstroConfigProvider } from "../../effect/server/AstroConfigProvider";
import { SessionMiddlewareLive } from "../../effect/server/middleware/Session";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import { HealthResponse, KilnApi, WebAuthnApiError } from "../../effect/shared/http";

const ApiGroupLive = HttpApiBuilder.group(KilnApi, "api", (handlers) =>
  handlers.handle("health", () => {
    return Effect.succeed(new HealthResponse({ status: "ok", timestamp: new Date().toISOString() }));
  }));

const AuthGroupLive = HttpApiBuilder.group(KilnApi, "auth", (handlers) =>
  handlers
    .handle("registerOptions", () =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.generateRegistrationOptions;
      }).pipe(Effect.mapError((error) => new WebAuthnApiError({ cause: error }))))
    .handle("registerVerify", ({ payload }) =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.verifyRegistrationResponse(payload.response);
      }).pipe(Effect.mapError((error) => new WebAuthnApiError({ cause: error }))))
    .handle("authenticateOptions", () =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        return yield* webAuthnService.generateAuthenticationOptions;
      }).pipe(Effect.mapError((error) => new WebAuthnApiError({ cause: error }))))
    .handle("authenticateVerify", ({ payload }) =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        const result = yield* webAuthnService.verifyAuthenticationResponse(payload.response);
        return result;
      }).pipe(Effect.mapError((error) => new WebAuthnApiError({ cause: error })))));

const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(
  Layer.provide(ApiGroupLive),
  Layer.provide(AuthGroupLive),
  Layer.provide(WebAuthnService.Default),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(Layer.setConfigProvider(AstroConfigProvider)),
);

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLayer, HttpServer.layerContext),
);

export const ALL: APIRoute = async ({ request }) => handler(request);

export const prerender = false;
