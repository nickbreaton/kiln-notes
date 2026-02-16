import { HttpApiBuilder, HttpMiddleware, HttpServer, HttpServerResponse, Multipart } from "@effect/platform";

import type { APIRoute } from "astro";
import { Effect, Layer, Option, Schema, Stream } from "effect";
import { NumberFromString } from "effect/Schema";
import { ImageId } from "../../effect/schema";
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
          fullContentLength?: string;
          thumbnailContentLength?: string;
          full?: Stream.Stream<Uint8Array, Multipart.MultipartError>;
          thumbnail?: Stream.Stream<Uint8Array, Multipart.MultipartError>;
        };

        const parts = yield* Stream.runFold(payload, {} as Parts, (acc, part) => {
          if (Multipart.isField(part) && part.key === "id") {
            return { ...acc, id: part.value };
          }
          if (Multipart.isFile(part) && part.key === "full") {
            return { ...acc, full: part.content };
          }
          if (Multipart.isFile(part) && part.key === "thumbnail") {
            return { ...acc, thumbnail: part.content };
          }
          if (Multipart.isField(part) && part.key === "full-content-length") {
            return { ...acc, fullContentLength: part.value };
          }
          if (Multipart.isField(part) && part.key === "thumbnail-content-length") {
            return { ...acc, thumbnailContentLength: part.value };
          }
          return acc;
        });

        const id = yield* Option.fromNullable(parts.id).pipe(Effect.andThen(Schema.decodeUnknown(ImageId)));
        const full = yield* Option.fromNullable(parts.full);
        const thumbnail = yield* Option.fromNullable(parts.thumbnail);

        const fullContentLength = yield* Option.fromNullable(parts.fullContentLength).pipe(
          Effect.andThen(Schema.decode(NumberFromString)),
        );

        const thumbnailContentLength = yield* Option.fromNullable(parts.thumbnailContentLength).pipe(
          Effect.andThen(Schema.decode(NumberFromString)),
        );

        const fullKey = `${userId}/${id}/full`;
        const thumbnailKey = `${userId}/${id}/thumbnail`;

        yield* imageStore.upload(fullKey, full.pipe(Stream.orDie), fullContentLength);
        yield* imageStore.upload(thumbnailKey, thumbnail.pipe(Stream.orDie), thumbnailContentLength);

        return { success: true };
      }).pipe(
        Effect.mapError((error) => new ImageUploadError({ cause: error })),
      ))
    .handleRaw("getFull", ({ path }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const imageStore = yield* ImageStore;
        const userId = session.user;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        const key = `${userId}/${path.id}/full`;
        const { stream } = yield* imageStore.get(key).pipe(
          Effect.mapError((error) => new ImageNotFoundError({ message: String(error.cause) })),
        );

        return HttpServerResponse.stream(stream);
      }))
    .handleRaw("getThumbnail", ({ path }) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const imageStore = yield* ImageStore;
        const userId = session.user;

        if (!userId) {
          return yield* new UnauthorizedError({ message: "Unauthorized" });
        }

        const key = `${userId}/${path.id}/thumbnail`;
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
