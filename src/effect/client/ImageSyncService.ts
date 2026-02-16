import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Option, Stream } from "effect";
import { ImageId } from "../schema";
import { KilnApi } from "../shared/http";
import { LocalImageService } from "./LocalImageService";
import { PieceRepository } from "./PieceRepository";

export class ImageSyncService extends Effect.Service<ImageSyncService>()("ImageSyncService", {
  dependencies: [
    LocalImageService.Default,
    PieceRepository.Default,
    FetchHttpClient.layer,
  ],
  effect: Effect.gen(function*() {
    const imageService = yield* LocalImageService;
    const pieceRepository = yield* PieceRepository;
    const syncSemaphore = yield* Effect.makeSemaphore(1);
    const client = yield* HttpApiClient.make(KilnApi);

    const requiresSync = Effect.fn(function*(id: ImageId) {
      // TODO: move this into loop below
      const pieces = yield* Stream.runHead(pieceRepository.pieces);

      if (Option.isNone(pieces)) {
        return false;
      }

      return pieces.value
        .flatMap(piece => piece.images)
        .some(image => image.id === id);
    });

    const sync = Effect.gen(function*() {
      const chunk = yield* Stream.runCollect(imageService.list());

      for (const imageId of chunk) {
        if (yield* requiresSync(imageId)) {
          const full = yield* imageService.getFull(imageId);
          const thumbnail = yield* imageService.getThumbnail(imageId);

          const payload = new FormData();
          payload.append("id", imageId);
          payload.append("full", full);
          payload.append("thumbnail", thumbnail);
          payload.append("full-content-length", String(full.size));
          payload.append("thumbnail-content-length", String(thumbnail.size));

          const { success } = yield* client.images.uploadImage({ payload });

          if (success) {
            yield* imageService.delete(imageId);
          }
        }
      }
    }).pipe(syncSemaphore.withPermits(1));

    return { sync };
  }),
}) {}
