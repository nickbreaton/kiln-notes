import { Effect, Layer, Schema } from "effect";
import { UserId } from "../../schema";
import * as Y from "yjs";
import { CloudflareBindings } from "../CloudflareBindings";
import { UserDocumentError, UserDocumentService } from "./UserDocumentService";

export const UserDocumentServiceCloudflare = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const { USER_DOCUMENTS } = yield* CloudflareBindings;

    const getUserDocumentStub = Effect.fn(function*(userId: UserId) {
      return USER_DOCUMENTS.getByName(userId);
    });

    const load = Effect.fn(function*(userId: UserId) {
      const userDocument = yield* getUserDocumentStub(userId);
      const stored = yield* Effect.promise(() => userDocument.get());
      const doc = new Y.Doc();

      if (stored) {
        const deserialized = yield* Schema.decodeEffect(Schema.Uint8ArrayFromBase64)(stored);
        Y.applyUpdate(doc, deserialized);
      }

      yield* Effect.addFinalizer(() => {
        return Effect.sync(() => doc.destroy());
      });

      return doc;
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    const update = Effect.fn(function*(userId: UserId, updater: (doc: Y.Doc) => void) {
      const userDocument = yield* getUserDocumentStub(userId);
      const doc = yield* load(userId);

      updater(doc);

      const value = Y.encodeStateAsUpdate(doc);
      const encoded = yield* Schema.encodeEffect(Schema.Uint8ArrayFromBase64)(value);

      yield* Effect.promise(() => userDocument.put(encoded));
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    return {
      load,
      update,
    };
  }),
);
