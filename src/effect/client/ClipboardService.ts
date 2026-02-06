import { Atom } from "@effect-atom/atom-react";
import { Effect, Layer, Stream, SubscriptionRef } from "effect";

export class ClipboardService extends Effect.Service<ClipboardService>()("ClipboardService", {
  effect: Effect.gen(function*() {
    const copiedRef = yield* SubscriptionRef.make(false);

    const copy = (text: string) =>
      Effect.gen(function*() {
        yield* Effect.promise(() => navigator.clipboard.writeText(text));
        yield* SubscriptionRef.set(copiedRef, true);

        // Reset after 2 seconds
        yield* Effect.sleep("2 seconds");
        yield* SubscriptionRef.set(copiedRef, false);
      });

    const copied = copiedRef.changes;

    return { copy, copied };
  }),
}) {}
