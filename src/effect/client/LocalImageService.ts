import { Effect, Schema, Stream } from "effect";

export class LocalImageError extends Schema.TaggedError<LocalImageError>()("LocalImageError", {
  cause: Schema.Unknown,
}) {}

export class LocalImageService extends Effect.Service<LocalImageService>()("LocalImageService", {
  dependencies: [],
  effect: Effect.gen(function*() {
    const imagesHandle = yield* Effect.promise(async () => {
      const opfsRoot = await navigator.storage.getDirectory();
      return await opfsRoot.getDirectoryHandle("images", { create: true });
    });

    return {
      get: (id: string) =>
        Effect.gen(function*() {
          const fileHandle = yield* Effect.promise(() => imagesHandle.getFileHandle(id));
          const file = yield* Effect.promise(() => fileHandle.getFile());
          const buffer = yield* Effect.promise(() => file.arrayBuffer());
          return new Blob([buffer]);
        }),

      delete: (id: string) =>
        Effect.gen(function*() {
          yield* Effect.promise(() => imagesHandle.removeEntry(id));
        }),

      list: () =>
        Stream.fromAsyncIterable(imagesHandle.keys(), (cause) => {
          return new LocalImageError({ cause });
        }),

      set: (id: string, blob: Blob) =>
        Effect.gen(function*() {
          const fileHandle = yield* Effect.promise(() => imagesHandle.getFileHandle(id, { create: true }));
          const file = yield* Effect.promise(() => fileHandle.createWritable());
          yield* Effect.promise(() => file.write(blob));
          yield* Effect.promise(() => file.close());
        }),
    };
  }),
}) {}