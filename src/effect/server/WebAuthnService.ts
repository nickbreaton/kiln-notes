import { KeyValueStore } from "@effect/platform";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import { Effect, Schema } from "effect";
import { RegistrationResponseJSON } from "../shared/authn";
import { Session } from "./middleware/Session";
import { RelayingPartyService } from "./RelayingPartyService";

const rpName = "Kiln Notes";

export class WebAuthnError extends Schema.TaggedError<WebAuthnError>()("WebAuthnError", {
  cause: Schema.Unknown,
}) {}

export class WebAuthnService extends Effect.Service<WebAuthnService>()("kiln-notes/effect/server/WebAuthnService", {
  dependencies: [KeyValueStore.layerMemory, RelayingPartyService.Default],
  effect: Effect.gen(function*() {
    const relayingParty = yield* RelayingPartyService;

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

        return result.registrationInfo;
      });

    return { generateRegistrationOptions, verifyRegistrationResponse };
  }),
}) {}
