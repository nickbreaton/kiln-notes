import { Effect, Layer, Queue, ServiceMap } from "effect";

export class SyncQueue extends ServiceMap.Service<SyncQueue>()("SyncQueue", {
  make: Effect.gen(function*() {
    const queue = yield* Queue.dropping<void>(0);

    return {
      sync: Queue.offer(queue, void 0).pipe(Effect.asVoid),
      wait: Queue.take(queue),
    };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
