import { Effect } from "effect";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

export class DocumentStore extends Effect.Service<DocumentStore>()("DocumentStore", {
  effect: Effect.gen(function*() {
    const doc = new Y.Doc();
    const provider = new IndexeddbPersistence("kiln", doc);

    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        emit(Effect.void);
      });
    });

    return { doc };
  }),
}) {}
