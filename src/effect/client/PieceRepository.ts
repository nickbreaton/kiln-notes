import { DateTime, Effect, Option, Schema, Stream, SubscriptionRef } from "effect";

import { Image, Piece } from "../schema";
import { DocumentStore } from "./DocumentStore";
import { LocalPhotoService } from "./LocalPhotoService";
import { ServiceWorkerCacheService } from "./ServiceWorkerCacheService";
import { ImageThumbnailService } from "./ImageThumbnailService";
import { SyncQueue } from "./SyncQueue";

export class PieceRepository extends Effect.Service<PieceRepository>()("PieceRepository", {
  dependencies: [
    LocalPhotoService.Default,
    ImageThumbnailService.Default,
    DocumentStore.Default,
    SyncQueue.Default,
    ServiceWorkerCacheService.Default,
  ],
  effect: Effect.gen(function*() {
    const { doc } = yield* DocumentStore;
    const map = doc.getMap<typeof Piece.Type>("piecesCollection");

    const photoService = yield* LocalPhotoService;
    const imageThumbnailService = yield* ImageThumbnailService;
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
              id: crypto.randomUUID(),
              createdAt: now,
              status: "drying",
            });

            const piece = Piece.make({
              id: crypto.randomUUID(),
              status: "drying",
              statusUpdatedAt: now,
              updatedAt: now,
              images: [image],
            });

            // Initially cache the original image with the service worker until
            // the thumbnail has been generated (takes a second or two).
            // yield* cacheService.cacheImage(image.id, file);

            const thumbnailFile = yield* imageThumbnailService.createThumbnail(file);

            yield* Effect.all([
              photoService.set(image.id, thumbnailFile),
              cacheService.cacheImage(image.id, thumbnailFile),
            ], {
              concurrency: "unbounded",
            });

            map.set(piece.id, piece);
          }

          yield* syncQueue.sync;
        }),

      movePiece: (uuid: Schema.UUID) =>
        Effect.gen(function*() {
          // Plan
          // 1. Call API to update piece with new status and tiemstamp
          // 2. Invaliates local storage stream
        }),

      deletePiece: (id: string) =>
        Effect.gen(function*() {
          map.delete(id);
          yield* syncQueue.sync;
        }),
    };
  }),
}) {}
