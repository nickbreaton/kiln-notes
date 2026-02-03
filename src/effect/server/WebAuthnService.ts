import { KeyValueStore } from "@effect/platform";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import { Effect, Option, Schema } from "effect";
import { RegistrationResponseJSON } from "../shared/authn";
import { Session } from "./middleware/Session";

const rpName = "Kiln Notes";
const rpID = "localhost";
const origin = `http://${rpID}:4321`;

export class WebAuthnError extends Schema.TaggedError<WebAuthnError>()("WebAuthnError", {
  cause: Schema.Unknown,
}) {}

export class WebAuthnService extends Effect.Service<WebAuthnService>()("kiln-notes/effect/server/WebAuthnService", {
  dependencies: [KeyValueStore.layerMemory],
  effect: Effect.gen(function*() {
    const generateRegistrationOptions = Effect.gen(function*() {
      const session = yield* Session;

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

    const verifyRegistrationResponse = ({ response, userId }: { response: RegistrationResponseJSON; userId: string }) =>
      Effect.gen(function*() {
        const session = yield* Session;

        const { expectedChallenge } = session;
        delete session.expectedChallenge;

        if (!expectedChallenge) {
          return yield* new WebAuthnError({ cause: new Error("Expected challenge could not be recovered") });
        }

        const result = yield* Effect.tryPromise({
          try: () =>
            SimpleWebAuthnServer.verifyRegistrationResponse({
              response,
              expectedChallenge: expectedChallenge,
              expectedRPID: rpID,
              expectedOrigin: origin,
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
