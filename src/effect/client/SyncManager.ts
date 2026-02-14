import { Console, Effect, Option, Queue, Schedule, Stream } from "effect";
import { DocumentStore } from "./DocumentStore";
import { ImageSyncService } from "./ImageSyncService";
import { SyncQueue } from "./SyncQueue";
import { UserService } from "./UserService";

export class SyncManager extends Effect.Service<SyncManager>()("SyncManager", {
  dependencies: [DocumentStore.Default, ImageSyncService.Default, SyncQueue.Default, UserService.Default],
  effect: Effect.gen(function*() {
    const documentStore = yield* DocumentStore;
    const imageSyncService = yield* ImageSyncService;
    const syncQueue = yield* SyncQueue;
    const userService = yield* UserService;

    yield* Effect.gen(function*() {
      yield* syncQueue.wait; // Waits until an item is enqueued to continue the loop
      yield* Effect.log("Sync initiated");
      yield* documentStore.sync;
      yield* imageSyncService.sync;
    }).pipe(
      Effect.forever,
      Effect.forkDaemon,
    );

    // Attempt sync on startup
    yield* syncQueue.sync;

    yield* Stream.mergeAll([
      Stream.fromSchedule(Schedule.spaced("1 minutes")),
      Stream.fromEventListener(window, "online"),
      Stream.fromEventListener(document, "visibilitychange"),
      userService.user.pipe(Stream.tap(Console.log)),
    ], { concurrency: "unbounded" })
      .pipe(
        Stream.throttle({
          units: 1,
          cost: () => 1,
          duration: "3 seconds",
          strategy: "enforce",
        }),
        Stream.filter(() => {
          return navigator.onLine;
        }),
        Stream.filterEffect(Effect.fn(function*() {
          const user = Option.flatten(yield* Stream.runHead(userService.user));
          return Option.isSome(user);
        })),
        Stream.tap(() => syncQueue.sync),
        Stream.runDrain,
        Effect.forkDaemon,
      );

    return {};
  }),
}) {}
