import { FileSystem, Path } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer, Stream } from "effect";
import { ImageStore, ImageStoreError } from "./ImageStore";

export const ImageStoreNode = Layer.effect(
  ImageStore,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const getPath = (key: string) => `./tmp/images/${key}`;

    const upload = Effect.fn(
      function*(key: string, file: Stream.Stream<Uint8Array>) {
        const resolved = getPath(key);
        yield* fs.makeDirectory(path.dirname(resolved), { recursive: true });
        yield* file.pipe(Stream.run(fs.sink(resolved)));
      },
      Effect.catchAllCause(cause => new ImageStoreError({ cause })),
    );

    const get = (key: string) =>
      Effect.succeed({
        stream: fs.stream(getPath(key)).pipe(
          Stream.catchAllCause(cause => new ImageStoreError({ cause })),
        ),
      });

    return {
      upload,
      get,
    };
  }),
).pipe(
  Layer.provide(NodeContext.layer),
);
