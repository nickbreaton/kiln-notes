import { Config, Effect, Schema } from "effect";
import { UserId } from "../schema";
import { RegistrationInfo, RegistrationInfoFromBase64 } from "../shared/webauthn";

export class UserService extends Effect.Service<UserService>()("kiln-notes/effect/server/UserService", {
  effect: Effect.gen(function*() {
    const users = yield* Config.array(Config.string(), "USERS").pipe(
      Config.withDefault([]),
      Effect.andThen(Schema.decode(Schema.Array(UserId))),
    );
    const passkeys: Record<UserId, RegistrationInfo> = {};

    for (const user of users) {
      const value = yield* Config.string(`PASSKEY_${user}`);
      passkeys[user] = yield* Schema.decode(RegistrationInfoFromBase64)(value);
    }

    return { all: users, passkeys };
  }),
}) {}
