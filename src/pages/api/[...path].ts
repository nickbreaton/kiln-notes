import { HttpApiBuilder, HttpServer } from "@effect/platform";

import type { APIRoute } from "astro";
import { Effect, Layer } from "effect";
import { AstroConfigProvider } from "../../effect/server/AstroConfigProvider";
import { CloudflareBindings } from "../../effect/server/CloudflareBindings";
import { Session, SessionMiddlewareLive } from "../../effect/server/middleware/Session";
import { SyncService } from "../../effect/server/SyncService";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import { HealthResponse, KilnApi, UnauthorizedError, WebAuthnApiError } from "../../effect/shared/http";

const ApiGroupLive = HttpApiBuilder.group(KilnApi, "api", (handlers) =>
  handlers
    .handle("health", () => {
      return Effect.succeed(new HealthResponse({ status: "ok", timestamp: new Date().toISOString() }));
    }));

const SyncGroupLive = HttpApiBuilder.group(KilnApi, "sync", (handlers) =>
  handlers
    .handle("pull", ({ payload }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const userId = session.user;
        const syncService = yield* SyncService;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        return yield* syncService.pull(userId, payload.stateVector);
      }).pipe(Effect.orDie))
    .handle("push", ({ payload }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const userId = session.user;
        const syncService = yield* SyncService;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        yield* syncService.push(userId, payload.diff);

        return { success: true };
      }).pipe(Effect.orDie)));

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
  Layer.provide(SyncGroupLive),
  Layer.provide(WebAuthnService.Default),
  Layer.provide(SyncService.Default),
  Layer.provide(SessionMiddlewareLive),
  Layer.provide(Layer.setConfigProvider(AstroConfigProvider)),
  Layer.merge(HttpServer.layerContext),
);

const { handler } = HttpApiBuilder.toWebHandler(ApiLayer);

export const ALL: APIRoute = async ({ request, locals }) => {
  // @ts-ignore -- Astro ↔ Cloudflare typings are suboptimal
  const bindings = CloudflareBindings.context(locals?.runtime?.env);

  return handler(request, bindings);
};

export const prerender = false;
