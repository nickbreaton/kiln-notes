import { KeyValueStore } from "@effect/platform";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import { Effect, Option, Schema } from "effect";
import { RegistrationResponseJSON } from "../shared/authn";

type RegistrationResponseJSONEncoded = Schema.Schema.Encoded<typeof RegistrationResponseJSON>;

const rpName = "Kiln Notes";
const rpID = "localhost";
const origin = `http://${rpID}:4321`;

export class WebAuthnError extends Schema.TaggedError<WebAuthnError>()("WebAuthnError", {
  cause: Schema.Unknown,
}) {}

export class WebAuthnService extends Effect.Service<WebAuthnService>()("kiln-notes/effect/server/WebAuthnService", {
  dependencies: [KeyValueStore.layerMemory],
  effect: Effect.gen(function*() {
    const kv = yield* KeyValueStore.KeyValueStore;

    const generateRegistrationOptions = Effect.gen(function*() {
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

      const { id: challengeId } = optionsJSON.user;

      yield* kv.set(`challenge:${challengeId}`, optionsJSON.challenge);

      return optionsJSON;
    });

    const verifyRegistrationResponse = ({ response, userId }: { response: RegistrationResponseJSON; userId: string }) =>
      Effect.gen(function*() {
        const expectedChallenge = yield* kv.get(`challenge:${userId}`);

        if (Option.isNone(expectedChallenge)) {
          return yield* new WebAuthnError({ cause: new Error("Expected challenge could not be recovered") });
        }

        const result = yield* Effect.tryPromise({
          try: () =>
            SimpleWebAuthnServer.verifyRegistrationResponse({
              response,
              expectedChallenge: expectedChallenge.value,
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
