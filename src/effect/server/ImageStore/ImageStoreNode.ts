import { FileSystem, Path } from "effect";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Effect, Layer, Stream } from "effect";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreNode = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const getPath = (key: string) => `./tmp/images/${key}`;

    const upload = (key: string, file: Stream.Stream<Uint8Array>, _contentLength: number) =>
      Effect.gen(function*() {
        const resolved = getPath(key);
        yield* fs.makeDirectory(path.dirname(resolved), { recursive: true });
        yield* file.pipe(Stream.run(fs.sink(resolved)));
      }).pipe(
        Effect.catchCause(cause => Effect.fail(new ImageStoreError({ cause }))),
      );

    const get = (key: string) =>
      Effect.succeed({
        stream: fs.stream(getPath(key)).pipe(
          Stream.catchCause(cause => Stream.fail(new ImageStoreError({ cause }))),
        ),
      });

    return {
      upload,
      get,
    };
  }),
).pipe(
  Layer.provide(NodeServices.layer),
);
