import { Effect } from "effect";

export class ServiceWorkerCacheService
  extends Effect.Service<ServiceWorkerCacheService>()("kiln-notes/effect/client/ServiceWorkerCacheService", {
    effect: Effect.gen(function*() {
      const CACHE_NAME = "piece-images";

      const cacheImage = (imageId: string, file: File) =>
        Effect.gen(function*() {
          yield* Effect.promise(async () => {
            const cache = await caches.open(CACHE_NAME);
            const response = new Response(file, {
              status: 200,
              headers: {
                "Content-Type": file.type,
                "Content-Length": String(file.size),
              },
            });
            await cache.put(`/api/image/get/${imageId}`, response);
          });
        });

      return { cacheImage };
    }),
  })
{}
