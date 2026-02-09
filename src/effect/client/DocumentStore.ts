import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Effect, Option, Ref, Runtime, Schedule, Stream } from "effect";
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

    const runtime = yield* Effect.runtime<never>();

    yield* Effect.async((emit) => {
      provider.once("synced", () => {
        emit(Effect.void);
      });
    });

    // After IndexedDB loads, initialize syncedStateVector from current doc state
    // so we don't re-download data we already have
    const initialStateVector = Y.encodeStateVector(doc);
    yield* Ref.set(syncedStateVector, initialStateVector);

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

      // Get current state vector and encode for server diff
      const currentStateVector = yield* Ref.get(syncedStateVector);
      const stateVectorBase64 = currentStateVector.length > 0
        ? btoa(String.fromCharCode(...Y.encodeStateVector(doc)))
        : "";

      // Step 1: GET server data first (before sending local changes)
      // Pass state vector so server only returns missing updates (empty string = no state vector)
      const remoteUpdate = yield* client.getSync({
        path: { stateVector: stateVectorBase64 || "_" },
      }).pipe(
        Effect.orElseSucceed(() => ({ update: "" })),
      );

      if (remoteUpdate.update.length > 0) {
        const decoded = Uint8Array.from(atob(remoteUpdate.update), c => c.charCodeAt(0));
        yield* applyUpdate(decoded);
        yield* Effect.log(`Sync: applied ${remoteUpdate.update.length} chars from server`);
      }

      // Mark synced AFTER applying server state, so we only send local changes made after this
      yield* markSynced;

      // Step 2: Now compute and POST local changes (after merging server data)
      const updateToSend = yield* getUpdateToSend;

      if (updateToSend.length > 0) {
        const base64Update = btoa(String.fromCharCode(...updateToSend));
        yield* client.postSync({ payload: { update: base64Update } }).pipe(
          Effect.tap(() => Effect.log(`Sync: sent ${base64Update.length} chars to server`)),
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

          const updateToSend = yield* getUpdateToSend;
          if (updateToSend.length > 0) {
            const base64Update = btoa(String.fromCharCode(...updateToSend));
            yield* client.postSync({ payload: { update: base64Update } }).pipe(
              Effect.tap(() => Effect.log(`Sync: pushed ${base64Update.length} chars to server`)),
              Effect.orElseSucceed(() => void 0),
            );
            yield* markSynced;
          }
        })
      ),
    );

    // Start the push stream in background
    yield* pushStream.pipe(Effect.forkDaemon);

    // Polling pull: check for remote changes every 30s
    const syncSchedule = Schedule.spaced("30 seconds");
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
