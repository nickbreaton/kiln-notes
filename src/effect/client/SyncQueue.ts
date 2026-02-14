import { Console, Effect, Queue } from "effect";

export class SyncQueue extends Effect.Service<SyncQueue>()("SyncQueue", {
  dependencies: [],
  effect: Effect.gen(function*() {
    const queue = yield* Queue.dropping<void>(0);

    return {
      sync: Queue.offer(queue, void 0).pipe(Effect.asVoid),
      wait: Queue.take(queue),
    };
  }),
}) {}
