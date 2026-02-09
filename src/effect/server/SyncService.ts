import { KeyValueStore } from "@effect/platform";
import { Effect, Option, Schema } from "effect";

export class SyncService extends Effect.Service<SyncService>()("kiln-notes/effect/server/SyncService", {
  dependencies: [KeyValueStore.layerMemory],
  effect: Effect.gen(function*() {
    const kv = yield* KeyValueStore.KeyValueStore;

    const getSyncUpdate = (userId: string) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        const maybeValue = yield* kv.get(key);
        return Option.match(maybeValue, { onNone: () => "", onSome: (value) => value });
      });

    const saveSyncUpdate = (userId: string, update: string) =>
      Effect.gen(function*() {
        const key = `sync:${userId}`;
        yield* kv.set(key, update);
      });

    return {
      getSyncUpdate,
      saveSyncUpdate,
    };
  }),
}) {}
