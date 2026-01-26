import { Effect } from "effect";

export class PhotoService extends Effect.Service<PhotoService>()(
  "PhotoService",
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const photosHandle = yield* Effect.promise(async () => {
        const opfsRoot = await navigator.storage.getDirectory();
        return await opfsRoot.getDirectoryHandle("photos", { create: true });
      });

      return {
        get: (id: string) =>
          Effect.gen(function* () {
            const fileHandle = yield* Effect.promise(() =>
              photosHandle.getFileHandle(id),
            );
            const file = yield* Effect.promise(() => fileHandle.getFile());
            const buffer = yield* Effect.promise(() => file.arrayBuffer());
            return new Blob([buffer]);
          }),

        setCache: (id: string, blob: Blob) =>
          Effect.gen(function* () {
            const fileHandle = yield* Effect.promise(() =>
              photosHandle.getFileHandle(id, { create: true }),
            );
            const file = yield* Effect.promise(() =>
              fileHandle.createWritable(),
            );
            yield* Effect.promise(() => file.write(blob));
            yield* Effect.promise(() => file.close());
          }),
      };
    }),
  },
) {}
