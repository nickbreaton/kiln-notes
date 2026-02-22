import { HttpApiClient } from "@effect/platform";
import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";
import { Console, Effect, Layer, Option, Schema, ServiceMap, SubscriptionRef } from "effect";
import { KilnApi } from "../shared/http";

export class WebAuthnClientRegistrationError
  extends Schema.TaggedErrorClass<WebAuthnClientRegistrationError>()("WebAuthnClientRegistrationError", {
    cause: Schema.Unknown,
  })
{}

export class WebAuthnClientAuthenticationError
  extends Schema.TaggedErrorClass<WebAuthnClientAuthenticationError>()("WebAuthnClientAuthenticationError", {
    cause: Schema.Unknown,
  })
{}

export class WebAuthnClientService
  extends ServiceMap.Service<WebAuthnClientService>()("kiln-notes/effect/client/WebAuthnClientService", {
    make: Effect.gen(function*() {
      const client = yield* HttpApiClient.make(KilnApi);
      const currentUser = yield* SubscriptionRef.make(Option.none<string>());

      // TODO:
      // 1. listen for CookieStore change events, read user cookie
      // 2. get value of user into atom
      // 3. Use atom to determine if user is authenticated App.tsx (replacees const mockedAuthState.isLoggedIn)

      const register = Effect.gen(function*() {
        const optionsJSON = yield* client.auth.registerOptions();

        const response = yield* Effect.tryPromise({
          try: () => SimpleWebAuthnBrowser.startRegistration({ optionsJSON }),
          catch: (error) => new WebAuthnClientRegistrationError({ cause: error }),
        });

        return yield* client.auth.registerVerify({
          payload: { response },
        });
      }).pipe(Effect.tapErrorCause(Console.error));

      const authenticate = Effect.gen(function*() {
        const optionsJSON = yield* client.auth.authenticateOptions();

        const response = yield* Effect.tryPromise({
          try: () => SimpleWebAuthnBrowser.startAuthentication({ optionsJSON }),
          catch: (error) => new WebAuthnClientAuthenticationError({ cause: error }),
        });

        return yield* client.auth.authenticateVerify({
          payload: { response },
        });
      }).pipe(Effect.tapErrorCause(Console.error));

      return { register, authenticate };
    }),
  })
{
  static layer = Layer.effect(this, this.make);
}
