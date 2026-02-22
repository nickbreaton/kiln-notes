import { DateTime, Effect, Layer, ServiceMap, Stream } from "effect";

import { Image, ImageId, Piece, PieceId } from "../schema";
import { DocumentStore } from "./DocumentStore";
import { ImageCompressionService } from "./ImageCompressionService";
import { LocalImageService } from "./LocalImageService";
import { ServiceWorkerCacheService } from "./ServiceWorkerCacheService";
import { SyncQueue } from "./SyncQueue";

export class PieceRepository extends ServiceMap.Service<PieceRepository>()("PieceRepository", {
  make: Effect.gen(function*() {
    const { doc } = yield* DocumentStore;
    const map = doc.getMap<typeof Piece.Type>("piecesCollection");

    const imageService = yield* LocalImageService;
    const imageCompressionService = yield* ImageCompressionService;
    const cacheService = yield* ServiceWorkerCacheService;
    const syncQueue = yield* SyncQueue;

    return {
      pieces: Stream.async<typeof Piece.Type[]>((emit) => {
        const callback = () => {
          emit.single(Array.from(map.values()));
        };

        callback();

        map.observe(callback);

        return Effect.sync(() => {
          map.unobserve(callback);
        });
      }),

      createPieces: (files: File[]) =>
        Effect.gen(function*() {
          const now = yield* DateTime.now;

          for (const file of files) {
            const image = Image.make({
              id: ImageId.make(crypto.randomUUID()),
              createdAt: now,
              status: "drying",
            });

            const piece = Piece.make({
              id: PieceId.make(crypto.randomUUID()),
              status: "drying",
              statusUpdatedAt: now,
              updatedAt: now,
              images: [image],
            });

            const [optimizedFile, thumbnailFile] = yield* Effect.all([
              imageCompressionService.optimize(file),
              imageCompressionService.createThumbnail(file),
            ], {
              concurrency: "unbounded",
            });

            yield* Effect.all([
              imageService.set(image.id, { full: optimizedFile, thumbnail: thumbnailFile }),
              cacheService.cacheFull(image.id, optimizedFile),
              cacheService.cacheThumbnail(image.id, thumbnailFile),
            ], {
              concurrency: "unbounded",
            });

            map.set(piece.id, piece);
          }

          yield* syncQueue.sync;
        }),

      movePiece: (pieceId: PieceId) =>
        Effect.gen(function*() {
          // Plan
          // 1. Call API to update piece with new status and tiemstamp
          // 2. Invaliates local storage stream
        }),

      deletePiece: (id: PieceId) =>
        Effect.gen(function*() {
          map.delete(id);
          yield* syncQueue.sync;
        }),
    };
  }),
}) {
  static layer = Layer.effect(this, this.make).pipe(
    Layer.provide(LocalImageService.layer),
    Layer.provide(ImageCompressionService.layer),
    Layer.provide(DocumentStore.layer),
    Layer.provide(ServiceWorkerCacheService.layer),
    Layer.provide(SyncQueue.layer),
  );
}
