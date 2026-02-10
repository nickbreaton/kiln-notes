import { Effect } from "effect";
import * as Y from "yjs";
import { UserDocumentService } from "./UserDocumentService";
import { UserDocumentServiceLive } from "./UserDocumentService/UserDocumentServiceLive";

export class SyncService extends Effect.Service<SyncService>()("SyncService", {
  dependencies: [UserDocumentServiceLive],
  scoped: Effect.gen(function*() {
    const userDocumentService = yield* UserDocumentService;

    const pull = Effect.fn(function*(userId: string, stateVector: Uint8Array) {
      const doc = yield* userDocumentService.load(userId);
      return {
        diff: Y.encodeStateAsUpdate(doc, stateVector),
        stateVector: Y.encodeStateVector(doc),
      };
    });

    const push = Effect.fn(function*(userId: string, diff: Uint8Array) {
      yield* userDocumentService.update(userId, doc => Y.applyUpdate(doc, diff));
    });

    return {
      push,
      pull,
    };
  }),
}) {}
