import type { ReadableStream } from "@cloudflare/workers-types";
import { Effect, Layer, Stream } from "effect";
import { CloudflareBindings } from "../CloudflareBindings";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreCloudflare = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const { IMAGES_BUCKET } = yield* CloudflareBindings;

    const upload = Effect.fn(function*(key: string, file: Stream.Stream<Uint8Array>, contentLength: number) {
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

    const get = Effect.fn(function*(key: string) {
      const object = yield* Effect.tryPromise({
        try: () => IMAGES_BUCKET.get(key),
        catch: (cause) => new ImageStoreError({ cause }),
      });

      if (!object?.body) {
        return yield* new ImageStoreError({ cause: new Error(`Image not found: ${key}`) });
      }

      const stream: Stream.Stream<Uint8Array, ImageStoreError> = Stream.fromReadableStream({
        // @ts-ignore - Effect and Cloudflare opaque type mismatch
        evaluate: () => object.body,
        onError: () => new ImageStoreError({ cause: new Error(`Error reading image: ${key}`) }),
      });

      return {
        stream,
      };
    });

    return {
      upload,
      get,
    };
  }),
);
