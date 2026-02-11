import { Effect, Layer, Option } from "effect";
import * as Y from "yjs";
import { Locals } from "../Locals";
import { UserDocumentError, UserDocumentService } from "./index";

export const UserDocumentServiceCloudflare = Layer.effect(
  UserDocumentService,
  Effect.gen(function*() {
    const load = Effect.fn(function*(userId: string) {
      // TODO: load from durable object
      console.log(yield* Effect.serviceOption(Locals));
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
