import { Effect, Layer, ServiceMap, Stream, SubscriptionRef } from "effect";

export class ClipboardService extends ServiceMap.Service<ClipboardService>()("ClipboardService", {
  make: Effect.gen(function*() {
    const copiedRef = yield* SubscriptionRef.make(false);

    const copy = (text: string) =>
      Effect.gen(function*() {
        yield* Effect.promise(() => navigator.clipboard.writeText(text));
        yield* SubscriptionRef.set(copiedRef, true);

        // Reset after 2 seconds
        yield* Effect.sleep("2 seconds");
        yield* SubscriptionRef.set(copiedRef, false);
      });

    const copied = SubscriptionRef.changes(copiedRef);

    return { copy, copied };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
