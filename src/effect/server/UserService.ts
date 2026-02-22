import { Config, Effect, Layer, Schema, ServiceMap } from "effect";
import { UserId } from "../schema";
import { RegistrationInfo, RegistrationInfoFromBase64 } from "../shared/webauthn";

export class UserService extends ServiceMap.Service<UserService>()("kiln-notes/effect/server/UserService", {
  make: Effect.gen(function*() {
    const users = yield* Config.array(Config.string(), "USERS").pipe(
      Config.withDefault([]),
      Effect.andThen(Schema.decodeEffect(Schema.Array(UserId))),
    );
    const passkeys: Record<UserId, RegistrationInfo> = {};

    for (const user of users) {
      const value = yield* Config.string(`PASSKEY_${user}`);
      passkeys[user] = yield* Schema.decodeEffect(RegistrationInfoFromBase64)(value);
    }

    return { all: users, passkeys };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
