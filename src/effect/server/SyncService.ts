import { KeyValueStore } from "@effect/platform";
import { Effect, Either, Encoding, Option } from "effect";
import * as Y from "yjs";

export class SyncService extends Effect.Service<SyncService>()("SyncService", {
  scoped: Effect.gen(function*() {
    // const kv = yield* KeyValueStore.KeyValueStore;

    // TODO: need seperate document per user
    const doc = new Y.Doc();

    yield* Effect.addFinalizer(() => {
      return Effect.sync(() => doc.destroy());
    });

    const pull = Effect.fn(function*(stateVector: Uint8Array) {
      return {
        diff: Y.encodeStateAsUpdate(doc, stateVector),
        stateVector: Y.encodeStateVector(doc),
      };
    });

    const push = Effect.fn(function*(diff: Uint8Array) {
      Y.applyUpdate(doc, diff);
    });

    return {
      push,
      pull,
    };
  }),
}) {}
