import { Effect, Layer, Schema, ServiceMap, Stream } from "effect";
import { ImageId } from "../schema";

export class LocalImageError extends Schema.TaggedError<LocalImageError>()("LocalImageError", {
  cause: Schema.Unknown,
}) {}

export class LocalImageService extends ServiceMap.Service<LocalImageService>()("LocalImageService", {
  make: Effect.gen(function*() {
    const imagesHandle = yield* Effect.promise(async () => {
      const opfsRoot = await navigator.storage.getDirectory();
      return await opfsRoot.getDirectoryHandle("images", { create: true });
    });

    const getImageDirectoryHandle = (id: ImageId, options?: { create?: boolean }) =>
      Effect.promise(() => imagesHandle.getDirectoryHandle(id, options));

    const getFile = (id: ImageId, name: "full" | "thumbnail") =>
      Effect.gen(function*() {
        const directoryHandle = yield* getImageDirectoryHandle(id);
        const fileHandle = yield* Effect.promise(() => directoryHandle.getFileHandle(name));
        return yield* Effect.promise(() => fileHandle.getFile());
      });

    const writeFile = (id: ImageId, name: "full" | "thumbnail", blob: Blob) =>
      Effect.gen(function*() {
        const directoryHandle = yield* getImageDirectoryHandle(id, { create: true });
        const fileHandle = yield* Effect.promise(() => directoryHandle.getFileHandle(name, { create: true }));
        const file = yield* Effect.promise(() => fileHandle.createWritable());
        yield* Effect.promise(() => file.write(blob));
        yield* Effect.promise(() => file.close());
      });

    return {
      getFull: (id: ImageId) => getFile(id, "full"),

      getThumbnail: (id: ImageId) => getFile(id, "thumbnail"),

      delete: (id: ImageId) =>
        Effect.gen(function*() {
          yield* Effect.promise(() => imagesHandle.removeEntry(id, { recursive: true }));
        }),

      list: () =>
        Stream.fromAsyncIterable(imagesHandle.keys(), (cause) => {
          return new LocalImageError({ cause });
        }).pipe(
          Stream.mapEffect(id =>
            Schema.decodeUnknown(ImageId)(id).pipe(
              Effect.mapError(cause => new LocalImageError({ cause })),
            )
          ),
        ),

      set: (id: ImageId, image: { full: Blob; thumbnail: Blob }) =>
        Effect.gen(function*() {
          yield* Effect.all([
            writeFile(id, "full", image.full),
            writeFile(id, "thumbnail", image.thumbnail),
          ], {
            concurrency: "unbounded",
          });
        }),
    };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
