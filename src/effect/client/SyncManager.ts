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

    yield* Stream.mergeAll([
      Stream.fromSchedule(Schedule.spaced("1 minutes")),
      Stream.fromEventListener(window, "online"),
      Stream.fromEventListener(document, "visibilitychange"),
    ], { concurrency: "unbounded" })
      .pipe(
        Stream.throttle({ cost: () => 1, units: 1, duration: "3 seconds", strategy: "enforce" }),
        Stream.filter(() => navigator.onLine),
        Stream.tap(() => syncQueue.sync),
        Stream.runDrain,
        Effect.forkDaemon,
      );

    return {};
  }),
}) {}
