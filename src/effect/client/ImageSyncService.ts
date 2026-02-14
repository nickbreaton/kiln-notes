import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Option, Stream } from "effect";
import { KilnApi } from "../shared/http";
import { LocalPhotoService } from "./LocalPhotoService";
import { PieceRepository } from "./PieceRepository";

export class ImageSyncService extends Effect.Service<ImageSyncService>()("ImageSyncService", {
  dependencies: [LocalPhotoService.Default, PieceRepository.Default, FetchHttpClient.layer],
  effect: Effect.gen(function*() {
    const photoService = yield* LocalPhotoService;
    const pieceRepository = yield* PieceRepository;
    const syncSemaphore = yield* Effect.makeSemaphore(1);
    const client = yield* HttpApiClient.make(KilnApi);

    const requiresSync = Effect.fn(function*(id: string) {
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
      const chunk = yield* Stream.runCollect(photoService.list());

      for (const imageId of chunk) {
        if (yield* requiresSync(imageId)) {
          const image = yield* photoService.get(imageId);

          const payload = new FormData();
          payload.append("id", imageId);
          payload.append("file", image);

          const { success } = yield* client.images.uploadImage({ payload });

          if (success) {
            yield* photoService.delete(imageId);
          }
        }
      }
    }).pipe(syncSemaphore.withPermits(1));

    return { sync };
  }),
}) {}
