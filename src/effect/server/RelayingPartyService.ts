import { HttpServerRequest } from "@effect/platform";
import { Array, Config, Effect, Layer, Schema, ServiceMap } from "effect";

export class RelayingPartyError extends Schema.TaggedError<RelayingPartyError>()("RelayingPartyError", {
  message: Schema.String,
}) {}

export class RelayingPartyService extends ServiceMap.Service<RelayingPartyService>()("RelayingPartyService", {
  make: Effect.gen(function*() {
    const allowedOrigins = yield* Config.array(Config.string(), "ALLOWED_ORIGINS").pipe(
      Config.withDefault([]),
      Config.map(Array.union(["http://localhost:4321"])),
    );

    const get = Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const url = yield* Schema.decode(Schema.URL)(request.originalUrl);

      if (!allowedOrigins.includes(url.origin)) {
        return yield* new RelayingPartyError({ message: `Origin "${url.origin}" not allowed as relaying party` });
      }

      return { rpID: url.hostname, origin: url.origin };
    });

    return { get };
  }),
}) {
  static layer = Layer.effect(this, this.make);
}
