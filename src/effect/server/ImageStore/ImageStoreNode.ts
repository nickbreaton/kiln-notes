import { Effect, Layer, Schema } from "effect";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreNode = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const upload = Effect.fn(function*(key: string, file: Schema.Uint8Array) {
      return yield* new ImageStoreError({ cause: "Not implemented" });
    });

    const get = Effect.fn(function*(key: string) {
      return yield* new ImageStoreError({ cause: "Not implemented" });
    });

    return {
      upload,
      get,
    };
  }),
);
