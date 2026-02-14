import type { HttpServerRequest } from "@effect/platform";
import { Context, Effect, Schema, Stream } from "effect";

export class ImageStoreError extends Schema.TaggedError<ImageStoreError>()("ImageStoreError", {
  cause: Schema.Unknown,
}) {}

export class ImageStore extends Context.Tag("ImageStore")<ImageStore, {
  readonly upload: (key: string, file: Stream.Stream<Uint8Array>) => Effect.Effect<void, ImageStoreError, never>;
  readonly get: (key: string) => Effect.Effect<URL, ImageStoreError, HttpServerRequest.HttpServerRequest>;
}>() {}
