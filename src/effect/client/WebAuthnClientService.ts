import { HttpApiClient } from "@effect/platform";
import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";
import { Console, Effect, Schema } from "effect";
import { KilnApi } from "../shared/http";

export class WebAuthnClientRegistrationError
  extends Schema.TaggedError<WebAuthnClientRegistrationError>()("WebAuthnClientRegistrationError", {
    cause: Schema.Unknown,
  })
{}

export class WebAuthnClientService
  extends Effect.Service<WebAuthnClientService>()("kiln-notes/effect/client/WebAuthnClientService", {
    effect: Effect.gen(function*() {
      const client = yield* HttpApiClient.make(KilnApi);

      const register = Effect.gen(function*() {
        const optionsJSON = yield* client["register-options"]();

        const response = yield* Effect.tryPromise({
          try: () => SimpleWebAuthnBrowser.startRegistration({ optionsJSON }),
          catch: (error) => new WebAuthnClientRegistrationError({ cause: error }),
        });

        const registration = yield* client["register-verify"]({ payload: { response, userId: optionsJSON.user.id } });

        console.log(registration);
      }).pipe(Effect.tapErrorCause(Console.error));

      return { register };
    }),
  })
{}
