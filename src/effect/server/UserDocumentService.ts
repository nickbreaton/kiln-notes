import { KeyValueStore } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { Effect, Layer, Option, Schema } from "effect";
import * as Y from "yjs";

const nodeKeyValueLayer = KeyValueStore.layerFileSystem("tmp/users").pipe(Layer.provide(NodeContext.layer));

export class UserDocumentService extends Effect.Service<UserDocumentService>()("UserDocumentService", {
  dependencies: [nodeKeyValueLayer],
  effect: Effect.gen(function*() {
    const kv = (yield* KeyValueStore.KeyValueStore).forSchema(Schema.Uint8Array);

    const load = Effect.fn(function*(userId: string) {
      const stored = yield* kv.get(userId);
      const doc = new Y.Doc();

      if (Option.isSome(stored)) {
        Y.applyUpdate(doc, stored.value);
      }

      yield* Effect.addFinalizer(() => {
        return Effect.sync(() => doc.destroy());
      });

      return doc;
    });

    const update = Effect.fn(function*(userId: string, updater: (doc: Y.Doc) => void) {
      const doc = yield* load(userId);
      updater(doc);
      const update = Y.encodeStateAsUpdate(doc);
      yield* kv.set(userId, update);
    });

    return {
      load,
      update,
    };
  }),
}) {}
