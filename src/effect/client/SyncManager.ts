import { Console, Effect, Queue, Schedule, Stream } from "effect";
import { DocumentStore } from "./DocumentStore";
import { ImageSyncService } from "./ImageSyncService";
import { SyncQueue } from "./SyncQueue";

export class SyncManager extends Effect.Service<SyncManager>()("SyncManager", {
  dependencies: [DocumentStore.Default, ImageSyncService.Default, SyncQueue.Default],
  effect: Effect.gen(function*() {
    const documentStore = yield* DocumentStore;
    const imageSyncService = yield* ImageSyncService;
    const syncQueue = yield* SyncQueue;

    yield* Effect.gen(function*() {
      yield* Effect.log("Sync initiated");
      yield* documentStore.sync;
      yield* imageSyncService.sync;
      yield* syncQueue.wait; // Waits until another item is enqueued to continue the loop
    }).pipe(
      Effect.forever,
      Effect.forkDaemon,
    );

    yield* Stream.fromSchedule(Schedule.spaced("30 seconds")).pipe(
      Stream.tap(() => syncQueue.sync),
      Stream.runDrain,
      Effect.forkDaemon,
    );

    return {};
  }),
}) {}
