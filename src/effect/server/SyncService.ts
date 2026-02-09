import { KeyValueStore } from "@effect/platform";
import { Effect, Either, Encoding, Option } from "effect";
import * as Y from "yjs";

export class SyncService extends Effect.Service<SyncService>()("kiln-notes/effect/server/SyncService", {
  dependencies: [KeyValueStore.layerFileSystem("node_modules/.kiln")],
  effect: Effect.gen(function*() {
    // const kv = yield* KeyValueStore.KeyValueStore;

    // TODO: need seperate document per user
    const doc = new Y.Doc();

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
