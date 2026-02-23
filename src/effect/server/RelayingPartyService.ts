import { Array, Config, Effect, Layer, Schema, ServiceMap } from "effect";
import { HttpServerRequest } from "effect/unstable/http";

export class RelayingPartyError extends Schema.TaggedErrorClass<RelayingPartyError>()("RelayingPartyError", {
  message: Schema.String,
}) {}

export class RelayingPartyService extends ServiceMap.Service<RelayingPartyService>()("RelayingPartyService", {
  make: Effect.gen(function*() {
    const allowedOrigins = yield* Config.schema(Schema.Array(Schema.String), "ALLOWED_ORIGINS").pipe(
      Config.withDefault(() => []),
      Config.map(Array.union(["http://localhost:4321"])),
    );

    const get = Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const currentRequest = yield* HttpServerRequest.toWeb(request).pipe(Effect.orDie);
      const url = yield* Schema.decodeUnknownEffect(Schema.URLFromString)(currentRequest.url);

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
