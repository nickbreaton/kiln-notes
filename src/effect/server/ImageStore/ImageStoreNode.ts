import { FileSystem, HttpServerRequest, Path } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer, Schema, Stream } from "effect";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreNode = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const upload = Effect.fn(function*(key: string, file: Stream.Stream<Uint8Array>) {
      const writePath = `./tmp/images/${key}`;
      yield* fs.makeDirectory(path.dirname(writePath), { recursive: true });
      yield* file.pipe(Stream.run(fs.sink(writePath)));
    }, Effect.catchAllCause(cause => new ImageStoreError({ cause })));

    const get = Effect.fn(function*(key: string) {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const baseUrl = yield* Schema.decode(Schema.URL)(request.originalUrl);
      const url = new URL(`/tmp/images/${key}`, baseUrl.origin);
      url.searchParams.set("raw", "");
      return url;
    }, Effect.catchAllCause(cause => new ImageStoreError({ cause })));

    return {
      upload,
      get,
    };
  }),
).pipe(
  Layer.provide(NodeContext.layer),
);
