import { KeyValueStore } from "@effect/platform";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import { Effect, Layer, Record, Schema, ServiceMap } from "effect";
import { AuthenticationResponseJSON, RegistrationInfoFromBase64, RegistrationResponseJSON } from "../shared/webauthn";
import { Session } from "./middleware/Session";
import { RelayingPartyService } from "./RelayingPartyService";
import { UserService } from "./UserService";

const rpName = "Kiln Notes";

export class WebAuthnError extends Schema.TaggedError<WebAuthnError>()("WebAuthnError", {
  cause: Schema.Unknown,
}) {}

export class WebAuthnService extends ServiceMap.Service<WebAuthnService>()("kiln-notes/effect/server/WebAuthnService", {
  make: Effect.gen(function*() {
    const relayingParty = yield* RelayingPartyService;
    const users = yield* UserService;

    const generateRegistrationOptions = Effect.gen(function*() {
      const session = yield* Session;
      const { rpID } = yield* relayingParty.get;

      const optionsJSON = yield* Effect.tryPromise({
        try: () =>
          SimpleWebAuthnServer.generateRegistrationOptions({
            rpID,
            rpName,
            userName: "Potter",
            attestationType: "none",
          }),
        catch: (error) => new WebAuthnError({ cause: error }),
      });

      session.expectedChallenge = optionsJSON.challenge;

      return optionsJSON;
    });

    const verifyRegistrationResponse = (response: RegistrationResponseJSON) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const { rpID: expectedRPID, origin: expectedOrigin } = yield* relayingParty.get;

        const { expectedChallenge } = session;
        delete session.expectedChallenge;

        if (!expectedChallenge) {
          return yield* new WebAuthnError({ cause: new Error("Expected challenge could not be recovered") });
        }

        const result = yield* Effect.tryPromise({
          try: () =>
            SimpleWebAuthnServer.verifyRegistrationResponse({
              response,
              expectedChallenge,
              expectedRPID,
              expectedOrigin,
            }),
          catch: (error) => new WebAuthnError({ cause: error }),
        });

        if (!result.verified) {
          return yield* new WebAuthnError({ cause: new Error("verifyRegistrationResponse returned not verified") });
        }

        return yield* Schema.encode(RegistrationInfoFromBase64)(result.registrationInfo);
      });

    const generateAuthenticationOptions = Effect.gen(function*() {
      const session = yield* Session;
      const { rpID } = yield* relayingParty.get;

      const optionsJSON = yield* Effect.tryPromise({
        try: () => SimpleWebAuthnServer.generateAuthenticationOptions({ rpID }),
        catch: (error) => new WebAuthnError({ cause: error }),
      });

      session.expectedChallenge = optionsJSON.challenge;

      return optionsJSON;
    });

    const verifyAuthenticationResponse = (response: AuthenticationResponseJSON) =>
      Effect.gen(function*() {
        const session = yield* Session;
        const { rpID: expectedRPID, origin: expectedOrigin } = yield* relayingParty.get;

        const { expectedChallenge } = session;
        delete session.expectedChallenge;

        if (!expectedChallenge) {
          return yield* new WebAuthnError({ cause: new Error("Expected challenge could not be recovered") });
        }

        const [user, matchedPasskey] = yield* Record.findFirst(users.passkeys, (passkey) => {
          return passkey.credential.id === response.id;
        });

        const { verified } = yield* Effect.tryPromise({
          try: () =>
            SimpleWebAuthnServer.verifyAuthenticationResponse({
              response,
              expectedChallenge,
              expectedOrigin,
              expectedRPID,
              credential: matchedPasskey.credential as SimpleWebAuthnServer.WebAuthnCredential,
            }),
          catch: (error) => new WebAuthnError({ cause: error }),
        });

        session.user = user;

        return { verified };
      });

    return {
      generateRegistrationOptions,
      verifyRegistrationResponse,
      generateAuthenticationOptions,
      verifyAuthenticationResponse,
    };
  }),
}) {
  static layer = Layer.effect(this, this.make).pipe(
    Layer.provide(KeyValueStore.layerMemory),
    Layer.provide(RelayingPartyService.layer),
    Layer.provide(UserService.layer),
  );
}
