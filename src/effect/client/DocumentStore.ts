import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Ref, Schedule } from "effect";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { KilnApi } from "../shared/http";

export class DocumentStore extends Effect.Service<DocumentStore>()("DocumentStore", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function*() {
    const doc = new Y.Doc();
    const provider = new IndexeddbPersistence("kiln", doc);
    const syncedStateVector = yield* Ref.make<Uint8Array>(new Uint8Array(0));
    const client = yield* HttpApiClient.make(KilnApi);

    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        emit(Effect.void);
      });
    });

    const getUpdateToSend = Effect.gen(function*() {
      const stateVector = yield* Ref.get(syncedStateVector);
      if (stateVector.length === 0) {
        return Y.encodeStateAsUpdate(doc);
      }
      return Y.encodeStateAsUpdate(doc, stateVector);
    });

    const applyUpdate = (update: Uint8Array) =>
      Effect.sync(() => {
        Y.applyUpdate(doc, update);
      });

    const markSynced = Effect.gen(function*() {
      const newStateVector = Y.encodeStateVector(doc);
      yield* Ref.set(syncedStateVector, newStateVector);
    });

    const performSync = Effect.gen(function*() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      yield* Effect.log("Sync: fetching remote state");

      // Step 1: GET server data first (before sending local changes)
      const remoteUpdate = yield* client.getSync().pipe(
        Effect.orElseSucceed(() => ({ update: "" })),
      );

      if (remoteUpdate.update.length > 0) {
        const decoded = Uint8Array.from(atob(remoteUpdate.update), c => c.charCodeAt(0));
        yield* applyUpdate(decoded);
        yield* Effect.log(`Sync: applied ${remoteUpdate.update.length} chars from server`);
      }

      // Step 2: Now compute and POST local changes (after merging server data)
      const updateToSend = yield* getUpdateToSend;

      if (updateToSend.length > 0) {
        const base64Update = btoa(String.fromCharCode(...updateToSend));
        yield* client.postSync({ payload: { update: base64Update } }).pipe(
          Effect.tap(() => Effect.log(`Sync: sent ${base64Update.length} chars to server`)),
          Effect.orElseSucceed(() => void 0),
        );
      }

      yield* markSynced;
    });

    const syncSchedule = Schedule.spaced("30 seconds");

    // TODO: can we have the schedule run immediately too?
    yield* performSync.pipe(Effect.forkDaemon);
    yield* performSync.pipe(
      Effect.schedule(syncSchedule),
      Effect.forkDaemon,
    );

    return {
      doc,
      getUpdateToSend,
      applyUpdate,
      markSynced,
    };
  }),
}) {}
