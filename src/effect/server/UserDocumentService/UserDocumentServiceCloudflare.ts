import { Effect, Layer, Option, Schema } from "effect";
import * as Y from "yjs";
import { CloudflareBindings } from "../CloudflareBindings";
import { UserDocumentError, UserDocumentService } from "./index";

export const UserDocumentServiceCloudflare = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const getUserDocumentStub = Effect.fn(function*(userId: string) {
      const bindings = yield* Effect.serviceOption(CloudflareBindings);
      const { USER_DOCUMENTS } = yield* bindings;
      return USER_DOCUMENTS.getByName(userId);
    });

    const load = Effect.fn(function*(userId: string) {
      const userDocument = yield* getUserDocumentStub(userId);
      const stored = yield* Effect.promise(() => userDocument.get());
      const doc = new Y.Doc();

      if (stored) {
        const deserialized = yield* Schema.decode(Schema.Uint8ArrayFromBase64)(stored);
        Y.applyUpdate(doc, deserialized);
      }

      yield* Effect.addFinalizer(() => {
        return Effect.sync(() => doc.destroy());
      });

      return doc;
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    const update = Effect.fn(function*(userId: string, updater: (doc: Y.Doc) => void) {
      const userDocument = yield* getUserDocumentStub(userId);
      const doc = yield* load(userId);

      updater(doc);

      const value = Y.encodeStateAsUpdate(doc);
      const encoded = yield* Schema.encode(Schema.Uint8ArrayFromBase64)(value);

      yield* Effect.promise(() => userDocument.set(encoded));
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    return {
      load,
      update,
    };
  }),
);
