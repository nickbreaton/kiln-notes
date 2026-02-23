import { NodeServices } from "@effect/platform-node";
import { Effect, Layer, Option, Schema, Scope } from "effect";
import { KeyValueStore } from "effect/unstable/persistence";
import * as Y from "yjs";
import { UserId } from "../../schema";
import { UserDocumentError, UserDocumentService } from "./UserDocumentService";

export const UserDocumentServiceNode = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const kv = KeyValueStore.toSchemaStore(yield* KeyValueStore.KeyValueStore, Schema.Uint8Array);

    const load = (userId: UserId): Effect.Effect<Y.Doc, UserDocumentError, Scope.Scope> =>
      Effect.gen(function*() {
        const stored = yield* kv.get(userId);
        const doc = new Y.Doc();

        if (Option.isSome(stored)) {
          Y.applyUpdate(doc, stored.value);
        }

        yield* Effect.addFinalizer(() => Effect.sync(() => doc.destroy()));

        return doc;
      }).pipe(Effect.catchCause(cause => Effect.fail(new UserDocumentError({ cause }))));

    const update = (
      userId: UserId,
      updater: (doc: Y.Doc) => void,
    ): Effect.Effect<void, UserDocumentError, Scope.Scope> =>
      Effect.gen(function*() {
        const doc = yield* load(userId);
        updater(doc);
        const update = Y.encodeStateAsUpdate(doc);
        yield* kv.set(userId, update);
      }).pipe(Effect.catchCause(cause => Effect.fail(new UserDocumentError({ cause }))));

    return {
      load,
      update,
    };
  }),
).pipe(
  Layer.provide(KeyValueStore.layerFileSystem("tmp/users")),
  Layer.provide(NodeServices.layer),
);
