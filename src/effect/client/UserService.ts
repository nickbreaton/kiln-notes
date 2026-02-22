import { Effect, Layer, Option, Schema, ServiceMap, Stream } from "effect";
import { UserId } from "../schema";

const UserCookieValue = Schema.NullOr(UserId);

export class UserService extends ServiceMap.Service<UserService>()("UserService", {
  make: Effect.gen(function*() {
    const getFromStore = Effect.promise(() => window.cookieStore.get("user") as Promise<{ value?: string } | null>);

    const user = Stream.make(void 0).pipe(
      Stream.concat(Stream.fromEventListener(window.cookieStore, "change")),
      Stream.mapEffect(() => getFromStore),
      Stream.map(item => item?.value ?? null),
      Stream.mapEffect(value => Schema.decodeUnknownEffect(UserCookieValue)(value)),
      Stream.map(Option.fromNullishOr),
    );

    return { user };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
