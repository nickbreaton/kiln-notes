import { Effect, Layer, Option, Schema, ServiceMap, Stream } from "effect";
import { UserId } from "../schema";

const UserCookieValue = Schema.NullOr(UserId);

export class UserService extends ServiceMap.Service<UserService>()("UserService", {
  make: Effect.gen(function*() {
    const getFromStore = Effect.promise(() => window.cookieStore.get("user"));

    const user = Stream.void.pipe(
      Stream.concat(Stream.fromEventListener(window.cookieStore, "change")),
      Stream.mapEffect(() => getFromStore),
      Stream.map(item => item?.value ?? null),
      Stream.mapEffect(Schema.decodeUnknown(UserCookieValue)),
      Stream.map(Option.fromNullable),
    );

    return { user };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
