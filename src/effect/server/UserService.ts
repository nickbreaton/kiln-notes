import { Config, Effect, Layer, Schema, ServiceMap } from "effect";
import { UserId } from "../schema";
import { RegistrationInfo, RegistrationInfoFromBase64 } from "../shared/webauthn";

export class UserService extends ServiceMap.Service<UserService>()("kiln-notes/effect/server/UserService", {
  make: Effect.gen(function*() {
    const usersCsv = yield* Config.string("USERS").pipe(
      Config.withDefault(() => ""),
    );
    const users = yield* Schema.decodeUnknownEffect(Schema.Array(UserId))(
      usersCsv.split(",").map((it) => it.trim()).filter((it) => it.length > 0),
    );
    const passkeys: Record<UserId, RegistrationInfo> = {};

    for (const user of users) {
      const value = yield* Config.string(`PASSKEY_${user}`);
      passkeys[user] = yield* Schema.decodeUnknownEffect(RegistrationInfoFromBase64)(value);
    }

    return { all: users, passkeys };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
