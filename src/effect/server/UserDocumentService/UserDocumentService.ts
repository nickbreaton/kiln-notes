import { Effect, Schema, Scope, ServiceMap } from "effect";
import { UserId } from "../../schema";
import * as Y from "yjs";

export class UserDocumentError extends Schema.TaggedErrorClass<UserDocumentError>()("UserDocumentError", {
  cause: Schema.Unknown,
}) {}

export class UserDocumentService extends ServiceMap.Service<UserDocumentService, {
  readonly load: (userId: UserId) => Effect.Effect<Y.Doc, UserDocumentError, Scope.Scope>;
  readonly update: (
    userId: UserId,
    updater: (doc: Y.Doc) => void,
  ) => Effect.Effect<void, UserDocumentError, Scope.Scope>;
}>()("UserDocumentService") {}
