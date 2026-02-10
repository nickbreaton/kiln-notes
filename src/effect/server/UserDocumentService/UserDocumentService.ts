import { Context, Effect, Layer, Schema, Scope } from "effect";
import * as Y from "yjs";
import { isCloudflare } from "../utils/cloudflare";
import { UserDocumentServiceCloudflare } from "./UserDocumentServiceCloudflare";
import { UserDocumentServiceNode } from "./UserDocumentServiceNode";

export class UserDocumentError extends Schema.TaggedError<UserDocumentError>()("UserDocumentError", {
  cause: Schema.Unknown,
}) {}

export class UserDocumentService extends Context.Tag("UserDocumentService")<UserDocumentService, {
  readonly load: (userId: string) => Effect.Effect<Y.Doc, UserDocumentError, Scope.Scope>;
  readonly update: (
    userId: string,
    updater: (doc: Y.Doc) => void,
  ) => Effect.Effect<void, UserDocumentError, Scope.Scope>;
}>() {
  static Live = Layer.unwrapEffect(
    Effect.sync(() => {
      return isCloudflare()
        ? UserDocumentServiceCloudflare
        : UserDocumentServiceNode;
    }),
  );
}
