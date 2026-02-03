import { HttpApiBuilder, HttpServer } from "@effect/platform";
import type { APIRoute } from "astro";
import { ConfigProvider, Effect, Layer, Schema } from "effect";
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
      }).pipe(Effect.mapError(() => new WebAuthnApiError())))
    .handle("registerVerify", ({ payload }) =>
      Effect.gen(function*() {
        const webAuthnService = yield* WebAuthnService;
        const registrationInfo = yield* webAuthnService.verifyRegistrationResponse(payload.response);

        // @effect-diagnostics-next-line preferSchemaOverJson:off -- no backing schema
        const encodedRegistrationInfo = yield* Schema.encode(Schema.StringFromBase64)(JSON.stringify(registrationInfo));

        return { registrationInfo: encodedRegistrationInfo };
      }).pipe(Effect.mapError(() => new WebAuthnApiError()))));

const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(
  Layer.provide(ApiGroupLive),
  Layer.provide(AuthGroupLive),
  Layer.provide(WebAuthnService.Default),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env))),
);

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLayer, HttpServer.layerContext),
);

export const ALL: APIRoute = async ({ request }) => handler(request);

export const prerender = false;
