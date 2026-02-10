import { Context, Effect, Schema, Scope } from "effect";
import * as Y from "yjs";

export class UserDocumentError extends Schema.TaggedError<UserDocumentError>()("UserDocumentError", {
  cause: Schema.Unknown,
}) {}

export class UserDocumentService extends Context.Tag("UserDocumentService")<UserDocumentService, {
  readonly load: (userId: string) => Effect.Effect<Y.Doc, UserDocumentError, Scope.Scope>;
  readonly update: (
    userId: string,
    updater: (doc: Y.Doc) => void,
  ) => Effect.Effect<void, UserDocumentError, Scope.Scope>;
}>() {}
