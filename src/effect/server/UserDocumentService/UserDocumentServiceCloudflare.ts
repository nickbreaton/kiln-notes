import { Effect, Layer } from "effect";
import * as Y from "yjs";
import { UserDocumentError, UserDocumentService } from "./UserDocumentService";

export const UserDocumentServiceCloudflare = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const load = Effect.fn(function*(userId: string) {
      // TODO: load from durable object
      return new Y.Doc();
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    const update = Effect.fn(function*(userId: string, updater: (doc: Y.Doc) => void) {
      // TODO: save to durable object
      console.log("noop: updating but not really saving");
    }, Effect.catchAllCause(cause => new UserDocumentError({ cause })));

    return {
      load,
      update,
    };
  }),
);
