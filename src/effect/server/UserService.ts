import { Config, Effect, Schema } from "effect";
import { RegistrationInfo, RegistrationInfoFromBase64 } from "../shared/webauthn";

export class UserService extends Effect.Service<UserService>()("kiln-notes/effect/server/UserService", {
  effect: Effect.gen(function*() {
    const all = yield* Config.array(Config.string(), "USERS").pipe(Config.withDefault([]));
    const passkeys: Record<string, RegistrationInfo> = {};

    for (const user of all) {
      const value = yield* Config.string(`PASSKEY_${user}`);
      passkeys[user] = yield* Schema.decode(RegistrationInfoFromBase64)(value);
    }

    return { all, passkeys };
  }),
}) {}
