import { FileSystem, HttpServerRequest } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreNode = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem;

    const upload = Effect.fn(function*(key: string, file: Uint8Array) {
      const path = `./tmp/images/${key}`;
      yield* fs.makeDirectory("./tmp/images", { recursive: true });
      yield* fs.writeFile(path, file);
    }, Effect.catchAllCause(cause => new ImageStoreError({ cause })));

    const get = Effect.fn(function*(key: string) {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const baseUrl = yield* Schema.decode(Schema.URL)(request.originalUrl);
      return new URL(`/tmp/images/${key}`, baseUrl.origin);
    }, Effect.catchAllCause(cause => new ImageStoreError({ cause })));

    return {
      upload,
      get,
    };
  }),
).pipe(
  Layer.provide(NodeContext.layer),
);
