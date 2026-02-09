import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";

import type { APIRoute } from "astro";
import { Effect, Layer } from "effect";
import * as Y from "yjs";
import { AstroConfigProvider } from "../../effect/server/AstroConfigProvider";
import { Session, SessionMiddlewareLive } from "../../effect/server/middleware/Session";
import { SyncService } from "../../effect/server/SyncService";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import { HealthResponse, KilnApi, SyncServiceError, UnauthorizedError, WebAuthnApiError } from "../../effect/shared/http";

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

        const update = yield* syncService.getSyncUpdate(userId, payload.stateVector).pipe(
          Effect.mapError((error) => new SyncServiceError({ cause: error })),
        );
        return { update };
      }))
    .handle("push", ({ payload }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const userId = session.user;
        const syncService = yield* SyncService;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        // Merge client update with existing state using Yjs CRDTs
        yield* syncService.mergeAndSave(userId, payload.update).pipe(
          Effect.mapError((error) => new SyncServiceError({ cause: error })),
        );
        return { success: true };
      })));

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
  Layer.provide(NodeContext.layer),
  Layer.provide(Layer.setConfigProvider(AstroConfigProvider)),
);

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLayer, HttpServer.layerContext),
);

export const ALL: APIRoute = async ({ request }) => handler(request);

export const prerender = false;
