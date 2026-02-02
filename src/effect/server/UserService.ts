import { Config, Effect } from "effect";

export class UserService extends Effect.Service<UserService>()("kiln-notes/effect/server/UserService", {
  effect: Effect.gen(function*() {
    const all = yield* Config.array(Config.string(), "USERS");
    return { all };
  }),
}) {}
