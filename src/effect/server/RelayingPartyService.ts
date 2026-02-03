import { HttpServerRequest } from "@effect/platform";
import { Config, Effect, Option, Schema } from "effect";

export class RelayingPartyError extends Schema.TaggedError<RelayingPartyError>()("RelayingPartyError", {
  message: Schema.String,
}) {}

export class RelayingPartyService extends Effect.Service<RelayingPartyService>()("RelayingPartyService", {
  effect: Effect.gen(function*() {
    const allowedOriginsFromConfig = yield* Config.option(Config.array(Config.string(), "RP_ORIGIN"));

    const allowedOrigins = [
      "http://localhost:4321",
      ...Option.getOrElse(allowedOriginsFromConfig, () => []),
    ];

    const get = Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const url = yield* Schema.decode(Schema.URL)(request.originalUrl);

      if (!allowedOrigins.includes(url.origin)) {
        return yield* new RelayingPartyError({ message: "Origin not allowed as relaying party" });
      }

      return { rpID: url.hostname, origin: url.origin };
    });

    return { get };
  }),
}) {}
