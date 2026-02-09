import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Encoding, Option, Ref, Schedule, Stream } from "effect";
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

    // Wait for IndexedDB to sync, then initialize syncedStateVector
    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        // After IndexedDB loads, initialize syncedStateVector from current doc state
        // so we don't re-download data we already have
        const initialStateVector = Y.encodeStateVector(doc);
        emit(Ref.set(syncedStateVector, initialStateVector));
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
        Y.applyUpdate(doc, update, "remote");
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

      // Get current state vector and encode for server diff
      const currentStateVector = yield* Ref.get(syncedStateVector);
      const stateVectorBase64 = currentStateVector.length > 0
        ? Encoding.encodeBase64(currentStateVector)
        : "";

      // Step 1: POST to get server data first (before sending local changes)
      // Pass state vector so server only returns missing updates
      const remoteUpdate = yield* client.sync.pull({
        payload: {
          stateVector: stateVectorBase64.length > 0
            ? Option.some(stateVectorBase64)
            : Option.none(),
        },
      }).pipe(
        Effect.orElseSucceed(() => ({ update: new Uint8Array(0) })),
      );

      if (remoteUpdate.update.length > 0) {
        yield* applyUpdate(remoteUpdate.update);
        yield* Effect.log(`Sync: applied ${remoteUpdate.update.length} bytes from server`);
      }

      // Mark synced AFTER applying server state, so we only send local changes made after this
      yield* markSynced;

      // Step 2: Now compute and POST local changes (after merging server data)
      const updateToSend = yield* getUpdateToSend;

      if (updateToSend.length > 0) {
        yield* client.sync.push({ payload: { update: updateToSend } }).pipe(
          Effect.tap(() => Effect.log(`Sync: sent ${updateToSend.length} bytes to server`)),
          Effect.orElseSucceed(() => void 0),
        );
      }
    });

    // Stream-based debounced push: send local changes 500ms after last edit
    const pushStream = Stream.async<Uint8Array>((emit) => {
      doc.on("update", (update: Uint8Array, origin: any) => {
        if (origin !== "remote") {
          emit.single(update);
        }
      });
    }).pipe(
      Stream.debounce("500 millis"),
      Stream.runForEach(() =>
        Effect.gen(function*() {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return;
          }

          // Capture state vector BEFORE getting updates to send
          // This prevents race condition where new edits arrive between get and mark
          const capturedStateVector = yield* Ref.get(syncedStateVector);
          const updateToSend = Y.encodeStateAsUpdate(doc, capturedStateVector);

          if (updateToSend.length > 0) {
            yield* client.sync.push({ payload: { update: updateToSend } }).pipe(
              Effect.tap(() => Effect.log(`Sync: pushed ${updateToSend.length} bytes to server`)),
              Effect.orElseSucceed(() => void 0),
            );
            // Mark the captured state vector as synced, not the current doc state
            // This ensures we don't lose edits that arrived during the push
            yield* Ref.set(syncedStateVector, Y.encodeStateVector(doc));
          }
        })
      ),
    );

    // Start the push stream in background
    yield* pushStream.pipe(Effect.forkDaemon);

    // Polling pull: run immediately, then check for remote changes every 30s
    const syncSchedule = Schedule.once.pipe(
      Schedule.andThen(Schedule.spaced("30 seconds"))
    );
    yield* performSync.pipe(
      Effect.schedule(syncSchedule),
      Effect.forkDaemon,
    );

    return {
      doc,
    };
  }),
}) {}
