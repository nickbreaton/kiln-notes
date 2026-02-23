import { Effect, Schema, ServiceMap, Stream } from "effect";

export class ImageStoreError extends Schema.TaggedErrorClass<ImageStoreError>()("ImageStoreError", {
  cause: Schema.Unknown,
}) {}

export class ImageStore extends ServiceMap.Service<ImageStore, {
  readonly upload: (
    key: string,
    file: Stream.Stream<Uint8Array>,
    contentLength: number,
  ) => Effect.Effect<void, ImageStoreError, never>;
  readonly get: (key: string) => Effect.Effect<{
    readonly stream: Stream.Stream<Uint8Array, ImageStoreError>;
  }, ImageStoreError>;
}>()("ImageStore") {}
