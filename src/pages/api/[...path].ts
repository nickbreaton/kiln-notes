import { HttpApiBuilder, HttpMiddleware, HttpServer, HttpServerResponse, Multipart } from "@effect/platform";

import type { APIRoute } from "astro";
import { Effect, Layer, Option, Schema, Stream } from "effect";
import { NumberFromString } from "effect/Schema";
import { AstroConfigProvider } from "../../effect/server/AstroConfigProvider";
import { CloudflareBindings } from "../../effect/server/CloudflareBindings";
import { ImageStore } from "../../effect/server/ImageStore";
import { ImageStoreLive } from "../../effect/server/ImageStore/ImageStoreLive";
import { ApiErrorLoggingMiddlewareLive } from "../../effect/server/middleware/ApiErrorLogging";
import { Session, SessionMiddlewareLive } from "../../effect/server/middleware/Session";
import { SyncService } from "../../effect/server/SyncService";
import { WebAuthnService } from "../../effect/server/WebAuthnService";
import {
  HealthResponse,
  ImageNotFoundError,
  ImageUploadError,
  KilnApi,
  UnauthorizedError,
  WebAuthnApiError,
} from "../../effect/shared/http";

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

const ImageGroupLive = HttpApiBuilder.group(KilnApi, "images", (handlers) =>
  handlers
    .handle("uploadImage", ({ payload }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const imageStore = yield* ImageStore;
        const userId = session.user;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        type Parts = {
          id?: string;
          contentLength?: string;
          file?: Stream.Stream<Uint8Array, Multipart.MultipartError>;
        };

        const parts = yield* Stream.runFold(payload, {} as Parts, (acc, part) => {
          if (Multipart.isFile(part) && part.key === "file") {
            return { ...acc, file: part.content };
          }
          if (Multipart.isField(part) && part.key === "id") {
            return { ...acc, id: part.value };
          }
          if (Multipart.isField(part) && part.key === "content-length") {
            return { ...acc, contentLength: part.value };
          }
          return acc;
        });

        const id = yield* Option.fromNullable(parts.id);
        const file = yield* Option.fromNullable(parts.file);

        const contentLength = yield* Option.fromNullable(parts.contentLength).pipe(
          Effect.andThen(Schema.decode(NumberFromString)),
        );

        const key = `${userId}/${id}`;

        yield* imageStore.upload(key, file.pipe(Stream.orDie), contentLength);

        return { success: true };
      }).pipe(
        Effect.mapError((error) => new ImageUploadError({ cause: error })),
      ))
    .handleRaw("getImage", ({ path }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const imageStore = yield* ImageStore;
        const userId = session.user;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        const key = `${userId}/${path.id}`;
        const { stream } = yield* imageStore.get(key).pipe(
          Effect.mapError((error) => new ImageNotFoundError({ message: String(error.cause) })),
        );

        return HttpServerResponse.stream(stream);
      })));

const ApiLayer = HttpApiBuilder.api(KilnApi).pipe(
  Layer.provide(ApiGroupLive),
  Layer.provide(AuthGroupLive),
  Layer.provide(SyncGroupLive),
  Layer.provide(ImageGroupLive),
  Layer.provide(WebAuthnService.Default),
  Layer.provide(SyncService.Default),
  Layer.provide(ImageStoreLive),
  Layer.provide(ApiErrorLoggingMiddlewareLive),
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
