import { Effect, Layer, ServiceMap } from "effect";
import { UserId } from "../schema";
import * as Y from "yjs";
import { Live as UserDocumentServiceLive } from "./UserDocumentService";
import { UserDocumentService } from "./UserDocumentService/UserDocumentService";

export class SyncService extends ServiceMap.Service<SyncService>()("SyncService", {
  make: Effect.gen(function*() {
    const userDocumentService = yield* UserDocumentService;

    const pull = Effect.fn(function*(userId: UserId, stateVector: Uint8Array) {
      const doc = yield* userDocumentService.load(userId);
      return {
        diff: Y.encodeStateAsUpdate(doc, stateVector),
        stateVector: Y.encodeStateVector(doc),
      };
    });

    const push = Effect.fn(function*(userId: UserId, diff: Uint8Array) {
      yield* userDocumentService.update(userId, doc => Y.applyUpdate(doc, diff));
    });

    return {
      push,
      pull,
    };
  }),
}) {
  static layer = Layer.effect(this, this.make).pipe(
    Layer.provide(UserDocumentServiceLive),
  );
}
