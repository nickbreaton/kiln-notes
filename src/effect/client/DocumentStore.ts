import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Layer, ServiceMap } from "effect";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { KilnApi } from "../shared/http";

export class DocumentStore extends ServiceMap.Service<DocumentStore>()("DocumentStore", {
  make: Effect.gen(function*() {
    const doc = new Y.Doc();
    const provider = new IndexeddbPersistence("kiln", doc);
    const client = yield* HttpApiClient.make(KilnApi);

    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        emit(Effect.void);
      });
    });

    yield* Effect.addFinalizer(() => {
      return Effect.sync(() => doc.destroy());
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

    return {
      doc,
      sync,
    };
  }),
}) {
  static layer = Layer.effect(this, this.make).pipe(
    Layer.provide(FetchHttpClient.layer),
  );
}
