import { KeyValueStore } from "@effect/platform";
import { Either, Effect, Encoding, Option } from "effect";
import * as Y from "yjs";

export class SyncService extends Effect.Service<SyncService>()("kiln-notes/effect/server/SyncService", {
  dependencies: [KeyValueStore.layerFileSystem("node_modules/.kiln")],
  effect: Effect.gen(function*() {
    const kv = yield* KeyValueStore.KeyValueStore;

    const getSyncUpdate = (userId: string, clientStateVector: Option.Option<string>) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        const maybeValue = yield* kv.get(key);
        const serverStateBase64 = Option.getOrElse(maybeValue, () => "");

        if (serverStateBase64.length === 0) {
          return new Uint8Array(0);
        }

        // Decode server state from base64 storage
        const serverBytes = yield* Encoding.decodeBase64(serverStateBase64).pipe(
          Either.match({
            onLeft: (error) => Effect.fail(new Error(`Failed to decode server state: ${error.message}`)),
            onRight: Effect.succeed,
          }),
        );

        // If client provided a real state vector, compute diff
        const maybeClientVector = Option.getOrElse(clientStateVector, () => "");
        if (maybeClientVector.length > 0) {
          const doc = new Y.Doc();
          Y.applyUpdate(doc, serverBytes);

          const clientBytes = yield* Encoding.decodeBase64(maybeClientVector).pipe(
            Either.match({
              onLeft: (error) => Effect.fail(new Error(`Failed to decode client state vector: ${error.message}`)),
              onRight: Effect.succeed,
            }),
          );

          const diffBytes = Y.encodeStateAsUpdate(doc, clientBytes);

          if (diffBytes.length === 0) {
            return new Uint8Array(0); // Client is up to date
          }

          return diffBytes;
        }

        // No state vector provided, return full state
        return serverBytes;
      });

    const mergeAndSave = (userId: string, clientUpdate: Uint8Array) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        const maybeExisting = yield* kv.get(key);

        // Create a fresh Yjs Doc and load existing state if present
        const doc = new Y.Doc();
        const existingBase64 = Option.getOrElse(maybeExisting, () => "");

        if (existingBase64.length > 0) {
          yield* Encoding.decodeBase64(existingBase64).pipe(
            Either.match({
              onLeft: () => Effect.void, // Ignore decode errors for existing state
              onRight: (bytes) => Effect.sync(() => Y.applyUpdate(doc, bytes)),
            }),
          );
        }

        // Apply client update
        if (clientUpdate.length > 0) {
          Y.applyUpdate(doc, clientUpdate);
        }

        // Save merged state back to KV as base64
        const mergedBytes = Y.encodeStateAsUpdate(doc);
        const mergedBase64 = Encoding.encodeBase64(mergedBytes);
        yield* kv.set(key, mergedBase64);

        return mergedBase64;
      });

    return {
      getSyncUpdate,
      mergeAndSave,
    };
  }),
}) {}
