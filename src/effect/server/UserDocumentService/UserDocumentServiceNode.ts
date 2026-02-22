import { KeyValueStore } from "@effect/platform";
import { Effect, Layer, Option, Schema } from "effect";
import { UserId } from "../../schema";
import * as Y from "yjs";
import { UserDocumentError, UserDocumentService } from "./UserDocumentService";

export const UserDocumentServiceNode = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const kv = (yield* KeyValueStore.KeyValueStore).forSchema(Schema.Uint8Array);

    const load = Effect.fn(function*(userId: UserId) {
      const stored = yield* kv.get(userId);
      const doc = new Y.Doc();

      if (Option.isSome(stored)) {
        Y.applyUpdate(doc, stored.value);
      }

      yield* Effect.addFinalizer(() => {
        return Effect.sync(() => doc.destroy());
      });

      return doc;
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    const update = Effect.fn(function*(userId: UserId, updater: (doc: Y.Doc) => void) {
      const doc = yield* load(userId);
      updater(doc);
      const update = Y.encodeStateAsUpdate(doc);
      yield* kv.set(userId, update);
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    return {
      load,
      update,
    };
  }),
).pipe(
  Layer.provide(KeyValueStore.layerFileSystem("tmp/users")),
  Layer.provide(Layer.unwrapEffect(
    Effect.promise(async () => {
      const { NodeContext } = await import("@effect/platform-node");
      return NodeContext.layer;
    }),
  )),
);
