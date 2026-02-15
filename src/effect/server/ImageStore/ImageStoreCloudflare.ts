import type { ReadableStream } from "@cloudflare/workers-types";
import { Effect, Layer, Stream } from "effect";
import { CloudflareBindings } from "../CloudflareBindings";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreCloudflare = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const getImagesBucket = Effect.gen(function*() {
      const bindings = yield* Effect.serviceOption(CloudflareBindings);
      const { IMAGES_BUCKET } = yield* bindings;
      return IMAGES_BUCKET;
    });

    const upload = Effect.fn(function*(key: string, file: Stream.Stream<Uint8Array>, contentLength: number) {
      const IMAGES_BUCKET = yield* getImagesBucket.pipe(
        Effect.catchAllCause(cause => new ImageStoreError({ cause })),
      );

      // @ts-ignore - Effect and Cloudflare opaque type mismatch
      const stream: ReadableStream = Stream.toReadableStream(file).pipeThrough(
        new FixedLengthStream(contentLength),
      );

      yield* Effect.tryPromise({
        try: () => IMAGES_BUCKET.put(key, stream),
        catch: (cause) => {
          console.log("Error uploading image:", cause);
          return new ImageStoreError({ cause });
        },
      });
    });

    const get = (key: string) =>
      Effect.gen(function*() {
        const IMAGES_BUCKET = yield* getImagesBucket.pipe(
          Effect.catchAllCause(cause => new ImageStoreError({ cause })),
        );

        const object = yield* Effect.tryPromise({
          try: () => IMAGES_BUCKET.get(key),
          catch: (cause) => new ImageStoreError({ cause }),
        });

        if (!object?.body) {
          return yield* new ImageStoreError({ cause: new Error(`Image not found: ${key}`) });
        }

        // @ts-ignore - Effect and Cloudflare opaque type mismatch
        const stream: Stream.Stream<Uint8Array> = Stream.fromReadableStream(object.body);

        return stream;
      }).pipe(Stream.unwrap);

    return {
      upload,
      get,
    };
  }),
);
