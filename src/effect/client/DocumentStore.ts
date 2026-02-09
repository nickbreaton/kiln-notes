import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Encoding, Option, Ref, Schedule, Stream } from "effect";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { KilnApi } from "../shared/http";

export class DocumentStore extends Effect.Service<DocumentStore>()("DocumentStore", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function*() {
    const doc = new Y.Doc();
    const provider = new IndexeddbPersistence("kiln", doc);
    const client = yield* HttpApiClient.make(KilnApi);

    // Wait for IndexedDB to sync, then initialize syncedStateVector
    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        emit(Effect.void);
      });
    });

    const sync = Effect.gen(function*() {
      const pullResponse = yield* client.sync.pull({
        payload: { stateVector: Y.encodeStateVector(doc) },
      });

      if (pullResponse.diff.length > 0) {
        Y.applyUpdate(doc, pullResponse.diff);
      }

      yield* client.sync.push({
        payload: { diff: Y.encodeStateAsUpdate(doc, pullResponse.stateVector) },
      });
    });

    yield* sync;

    return {
      doc,
    };
  }),
}) {}
