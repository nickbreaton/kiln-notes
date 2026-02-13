import { Effect, Option, Stream } from "effect";
import { LocalPhotoService } from "./LocalPhotoService";
import { PieceRepository } from "./PieceRepository";

export class ImageSyncService extends Effect.Service<ImageSyncService>()("ImageSyncService", {
  dependencies: [LocalPhotoService.Default, PieceRepository.Default],
  effect: Effect.gen(function*() {
    const photoService = yield* LocalPhotoService;
    const pieceRepository = yield* PieceRepository;
    const syncSemaphore = yield* Effect.makeSemaphore(1);

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

      for (const [id, image] of chunk) {
        if (yield* requiresSync(id)) {
          console.log("todo: actually upload these", id, image);
          yield* Effect.sleep("1 seconds");
          // TODO: delete from local store
        }
      }
    }).pipe(syncSemaphore.withPermits(1));

    return { sync };
  }),
}) {}
