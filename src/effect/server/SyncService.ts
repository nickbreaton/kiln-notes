import { KeyValueStore } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Option } from "effect";
import * as Y from "yjs";

export class SyncService extends Effect.Service<SyncService>()("kiln-notes/effect/server/SyncService", {
  dependencies: [KeyValueStore.layerFileSystem("node_modules/.kiln")],
  effect: Effect.gen(function*() {
    const kv = yield* KeyValueStore.KeyValueStore;

    const getSyncUpdate = (userId: string, clientStateVector: string) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        const maybeValue = yield* kv.get(key);
        const serverState = Option.getOrElse(maybeValue, () => "");

        if (serverState.length === 0) {
          return "";
        }

        // If client provided a real state vector (not "_" placeholder), compute diff
        if (clientStateVector && clientStateVector !== "_" && clientStateVector.length > 0) {
          const doc = new Y.Doc();
          const serverBytes = Uint8Array.from(atob(serverState), c => c.charCodeAt(0));
          Y.applyUpdate(doc, serverBytes);

          const clientBytes = Uint8Array.from(atob(clientStateVector), c => c.charCodeAt(0));
          const diffBytes = Y.encodeStateAsUpdate(doc, clientBytes);

          if (diffBytes.length === 0) {
            return ""; // Client is up to date
          }

          return btoa(String.fromCharCode(...diffBytes));
        }

        // No state vector provided, return full state
        return serverState;
      });

    const mergeAndSave = (userId: string, clientUpdate: string) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        const maybeExisting = yield* kv.get(key);

        // Create a fresh Yjs Doc and load existing state if present
        const doc = new Y.Doc();
        const existingBase64 = Option.getOrElse(maybeExisting, () => "");

        if (existingBase64.length > 0) {
          const existingBytes = Uint8Array.from(atob(existingBase64), c => c.charCodeAt(0));
          Y.applyUpdate(doc, existingBytes);
        }

        // Apply client update
        if (clientUpdate.length > 0) {
          const clientBytes = Uint8Array.from(atob(clientUpdate), c => c.charCodeAt(0));
          Y.applyUpdate(doc, clientBytes);
        }

        // Save merged state back to KV
        const mergedBytes = Y.encodeStateAsUpdate(doc);
        const mergedBase64 = btoa(String.fromCharCode(...mergedBytes));
        yield* kv.set(key, mergedBase64);

        return mergedBase64;
      });

    return {
      getSyncUpdate,
      mergeAndSave,
    };
  }),
}) {}
