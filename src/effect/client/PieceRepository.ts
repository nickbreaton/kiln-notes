import { DateTime, Effect, Option, Schema, Stream, SubscriptionRef } from "effect";

import { Image, ImageId, Piece, PieceId } from "../schema";
import { ImageCompressionService } from "./ImageCompressionService";
import { DocumentStore } from "./DocumentStore";
import { LocalImageService } from "./LocalImageService";
import { ServiceWorkerCacheService } from "./ServiceWorkerCacheService";
import { SyncQueue } from "./SyncQueue";

export class PieceRepository extends Effect.Service<PieceRepository>()("PieceRepository", {
  dependencies: [
    LocalImageService.Default,
    ImageCompressionService.Default,
    DocumentStore.Default,
    SyncQueue.Default,
    ServiceWorkerCacheService.Default,
  ],
  effect: Effect.gen(function*() {
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

            const optimizedFile = yield* imageCompressionService.optimize(file);

            yield* Effect.all([
              imageService.set(image.id, optimizedFile),
              cacheService.cacheImage(image.id, optimizedFile),
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
}) {}
