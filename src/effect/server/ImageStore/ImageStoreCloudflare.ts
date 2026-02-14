import type { ReadableStream } from "@cloudflare/workers-types";
import { Effect, Layer, Stream } from "effect";
import { CloudflareBindings } from "../CloudflareBindings";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreCloudflare = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    console.log("before");
    const bindings = yield* Effect.serviceOption(CloudflareBindings);
    console.log("bindings", bindings);
    const { IMAGES_BUCKET } = yield* bindings;
    console.log("IMAGES", IMAGES_BUCKET);

    const upload = Effect.fn(function*(key: string, file: Stream.Stream<Uint8Array>) {
      // @ts-ignore - Effect and Cloudflare opaque type mismatch
      const stream: ReadableStream = Stream.toReadableStream(file);

      yield* Effect.tryPromise({
        try: () => IMAGES_BUCKET.put(key, stream),
        catch: (cause) => new ImageStoreError({ cause }),
      });
    });

    const get = (key: string) =>
      Effect.gen(function*() {
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
