import { Effect } from "effect";
import { DocumentStore } from "./DocumentStore";
import { ImageSyncService } from "./ImageSyncService";

export class SyncManager extends Effect.Service<SyncManager>()("SyncManager", {
  dependencies: [DocumentStore.Default, ImageSyncService.Default],
  effect: Effect.gen(function*() {
    const documentStore = yield* DocumentStore;
    const imageSyncService = yield* ImageSyncService;

    const sync = Effect.gen(function*() {
      console.log("count");
      yield* documentStore.sync;
      yield* imageSyncService.sync;
    });

    // TODO: run on change, etc
    yield* sync.pipe(Effect.forkDaemon);

    return {};
  }),
}) {}
