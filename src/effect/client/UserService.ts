import { Effect, Option, Schema, Stream } from "effect";

export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function*() {
    const getFromStore = Effect.promise(() => window.cookieStore.get("user"));

    const user = Stream.void.pipe(
      Stream.concat(Stream.fromEventListener(window.cookieStore, "change")),
      Stream.mapEffect(() => getFromStore),
      Stream.map(item => Option.fromNullable(item?.value)),
    );

    return { user };
  }),
}) {}
