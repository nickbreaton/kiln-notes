import { Schema } from "effect";

const Base64URLString = Schema.String;
const COSEAlgorithmIdentifier = Schema.Number;

const AuthenticatorTransportFuture = Schema.Union([
  Schema.Literal("ble"),
  Schema.Literal("cable"),
  Schema.Literal("hybrid"),
  Schema.Literal("internal"),
  Schema.Literal("nfc"),
  Schema.Literal("smart-card"),
  Schema.Literal("usb"),
]);

const MutableArray = <S extends Schema.Top>(schema: S) => Schema.mutable(Schema.Array(schema));

const CredentialPropertiesOutput = Schema.Struct({
  rk: Schema.optional(Schema.Boolean),
});

const AuthenticationExtensionsClientOutputs = Schema.Struct({
  appid: Schema.optional(Schema.Boolean),
  credProps: Schema.optional(CredentialPropertiesOutput),
  hmacCreateSecret: Schema.optional(Schema.Boolean),
});

const AuthenticatorAttestationResponseJSON = Schema.Struct({
  clientDataJSON: Base64URLString,
  attestationObject: Base64URLString,
  authenticatorData: Schema.optional(Base64URLString),
  transports: Schema.optional(MutableArray(AuthenticatorTransportFuture)),
  publicKeyAlgorithm: Schema.optional(COSEAlgorithmIdentifier),
  publicKey: Schema.optional(Base64URLString),
});

export const RegistrationResponseJSON = Schema.Struct({
  id: Base64URLString,
  rawId: Base64URLString,
  response: AuthenticatorAttestationResponseJSON,
  authenticatorAttachment: Schema.optional(
    Schema.Union([Schema.Literal("cross-platform"), Schema.Literal("platform")]),
  ),
  clientExtensionResults: AuthenticationExtensionsClientOutputs,
  type: Schema.Literal("public-key"),
});
export type RegistrationResponseJSON = Schema.Schema.Type<typeof RegistrationResponseJSON>;

const PublicKeyCredentialRpEntity = Schema.Struct({
  id: Schema.optional(Schema.String),
  name: Schema.String,
});

const PublicKeyCredentialUserEntityJSON = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  displayName: Schema.String,
});

const PublicKeyCredentialParameters = Schema.Struct({
  alg: COSEAlgorithmIdentifier,
  type: Schema.Literal("public-key"),
});

const PublicKeyCredentialDescriptorJSON = Schema.Struct({
  id: Base64URLString,
  type: Schema.Literal("public-key"),
  transports: Schema.optional(MutableArray(AuthenticatorTransportFuture)),
});

const AuthenticatorAttachment = Schema.Union([
  Schema.Literal("cross-platform"),
  Schema.Literal("platform"),
]);

const ResidentKeyRequirement = Schema.Union([
  Schema.Literal("discouraged"),
  Schema.Literal("preferred"),
  Schema.Literal("required"),
]);

const UserVerificationRequirement = Schema.Union([
  Schema.Literal("discouraged"),
  Schema.Literal("preferred"),
  Schema.Literal("required"),
]);

const AuthenticatorSelectionCriteria = Schema.Struct({
  authenticatorAttachment: Schema.optional(AuthenticatorAttachment),
  requireResidentKey: Schema.optional(Schema.Boolean),
  residentKey: Schema.optional(ResidentKeyRequirement),
  userVerification: Schema.optional(UserVerificationRequirement),
});

const PublicKeyCredentialHint = Schema.Union([
  Schema.Literal("hybrid"),
  Schema.Literal("security-key"),
  Schema.Literal("client-device"),
]);

const AttestationConveyancePreference = Schema.Union([
  Schema.Literal("direct"),
  Schema.Literal("enterprise"),
  Schema.Literal("indirect"),
  Schema.Literal("none"),
]);

const AttestationFormat = Schema.Union([
  Schema.Literal("fido-u2f"),
  Schema.Literal("packed"),
  Schema.Literal("android-safetynet"),
  Schema.Literal("android-key"),
  Schema.Literal("tpm"),
  Schema.Literal("apple"),
  Schema.Literal("none"),
]);

const AuthenticationExtensionsClientInputs = Schema.Struct({
  appid: Schema.optional(Schema.String),
  credProps: Schema.optional(Schema.Boolean),
  hmacCreateSecret: Schema.optional(Schema.Boolean),
  minPinLength: Schema.optional(Schema.Boolean),
});

export const WebAuthnCredential = Schema.Struct({
  id: Base64URLString,
  publicKey: Schema.Uint8Array,
  counter: Schema.Number,
  transports: Schema.optional(MutableArray(AuthenticatorTransportFuture)),
});
export type WebAuthnCredential = Schema.Schema.Type<typeof WebAuthnCredential>;

const AuthenticatorAssertionResponseJSON = Schema.Struct({
  clientDataJSON: Base64URLString,
  authenticatorData: Base64URLString,
  signature: Base64URLString,
  userHandle: Schema.optional(Base64URLString),
  attestationObject: Schema.optional(Base64URLString),
});

export const AuthenticationResponseJSON = Schema.Struct({
  id: Base64URLString,
  rawId: Base64URLString,
  response: AuthenticatorAssertionResponseJSON,
  authenticatorAttachment: Schema.optional(
    Schema.Union([Schema.Literal("cross-platform"), Schema.Literal("platform")]),
  ),
  clientExtensionResults: AuthenticationExtensionsClientOutputs,
  type: Schema.Literal("public-key"),
});
export type AuthenticationResponseJSON = Schema.Schema.Type<typeof AuthenticationResponseJSON>;

export const PublicKeyCredentialRequestOptionsJSON = Schema.Struct({
  challenge: Base64URLString,
  timeout: Schema.optional(Schema.Number),
  rpId: Schema.optional(Schema.String),
  allowCredentials: Schema.optional(MutableArray(PublicKeyCredentialDescriptorJSON)),
  userVerification: Schema.optional(UserVerificationRequirement),
  hints: Schema.optional(MutableArray(PublicKeyCredentialHint)),
  extensions: Schema.optional(AuthenticationExtensionsClientInputs),
});

export const PublicKeyCredentialCreationOptionsJSON = Schema.Struct({
  rp: PublicKeyCredentialRpEntity,
  user: PublicKeyCredentialUserEntityJSON,
  challenge: Base64URLString,
  pubKeyCredParams: MutableArray(PublicKeyCredentialParameters),
  timeout: Schema.optional(Schema.Number),
  excludeCredentials: Schema.optional(MutableArray(PublicKeyCredentialDescriptorJSON)),
  authenticatorSelection: Schema.optional(AuthenticatorSelectionCriteria),
  hints: Schema.optional(MutableArray(PublicKeyCredentialHint)),
  attestation: Schema.optional(AttestationConveyancePreference),
  attestationFormats: Schema.optional(MutableArray(AttestationFormat)),
  extensions: Schema.optional(AuthenticationExtensionsClientInputs),
});

export const RegistrationInfo = Schema.Struct({
  aaguid: Base64URLString,
  attestationObject: Schema.Uint8Array,
  credential: WebAuthnCredential,
  credentialBackedUp: Schema.Boolean,
  credentialDeviceType: Schema.Union([Schema.Literal("singleDevice"), Schema.Literal("multiDevice")]),
  credentialType: Schema.Literal("public-key"),
  fmt: AttestationFormat,
  origin: Schema.String,
  rpID: Schema.optional(Schema.String),
  userVerified: Schema.Boolean,
});
export type RegistrationInfo = Schema.Schema.Type<typeof RegistrationInfo>;

export const RegistrationInfoFromBase64 = Schema.fromJsonString(RegistrationInfo);
