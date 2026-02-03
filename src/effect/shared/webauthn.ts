import { Schema } from "effect";

const Base64URLString = Schema.String;
const COSEAlgorithmIdentifier = Schema.Number;

const AuthenticatorTransportFuture = Schema.Union(
  Schema.Literal("ble"),
  Schema.Literal("cable"),
  Schema.Literal("hybrid"),
  Schema.Literal("internal"),
  Schema.Literal("nfc"),
  Schema.Literal("smart-card"),
  Schema.Literal("usb"),
);

const MutableArray = <A, I, R>(schema: Schema.Schema<A, I, R>) => Schema.mutable(Schema.Array(schema));

class CredentialPropertiesOutput extends Schema.Class<CredentialPropertiesOutput>("CredentialPropertiesOutput")({
  rk: Schema.optionalWith(Schema.Boolean, { exact: true }),
}) {}

class AuthenticationExtensionsClientOutputs
  extends Schema.Class<AuthenticationExtensionsClientOutputs>("AuthenticationExtensionsClientOutputs")({
    appid: Schema.optionalWith(Schema.Boolean, { exact: true }),
    credProps: Schema.optionalWith(CredentialPropertiesOutput, { exact: true }),
    hmacCreateSecret: Schema.optionalWith(Schema.Boolean, { exact: true }),
  })
{}

class AuthenticatorAttestationResponseJSON
  extends Schema.Class<AuthenticatorAttestationResponseJSON>("AuthenticatorAttestationResponseJSON")({
    clientDataJSON: Base64URLString,
    attestationObject: Base64URLString,
    authenticatorData: Schema.optionalWith(Base64URLString, { exact: true }),
    transports: Schema.optionalWith(MutableArray(AuthenticatorTransportFuture), { exact: true }),
    publicKeyAlgorithm: Schema.optionalWith(COSEAlgorithmIdentifier, { exact: true }),
    publicKey: Schema.optionalWith(Base64URLString, { exact: true }),
  })
{}

export class RegistrationResponseJSON extends Schema.Class<RegistrationResponseJSON>("RegistrationResponseJSON")({
  id: Base64URLString,
  rawId: Base64URLString,
  response: AuthenticatorAttestationResponseJSON,
  authenticatorAttachment: Schema.optionalWith(
    Schema.Union(Schema.Literal("cross-platform"), Schema.Literal("platform")),
    { exact: true },
  ),
  clientExtensionResults: AuthenticationExtensionsClientOutputs,
  type: Schema.Literal("public-key"),
}) {}

class PublicKeyCredentialRpEntity extends Schema.Class<PublicKeyCredentialRpEntity>("PublicKeyCredentialRpEntity")({
  id: Schema.optionalWith(Schema.String, { exact: true }),
  name: Schema.String,
}) {}

class PublicKeyCredentialUserEntityJSON
  extends Schema.Class<PublicKeyCredentialUserEntityJSON>("PublicKeyCredentialUserEntityJSON")({
    id: Schema.String,
    name: Schema.String,
    displayName: Schema.String,
  })
{}

class PublicKeyCredentialParameters
  extends Schema.Class<PublicKeyCredentialParameters>("PublicKeyCredentialParameters")({
    alg: COSEAlgorithmIdentifier,
    type: Schema.Literal("public-key"),
  })
{}

class PublicKeyCredentialDescriptorJSON
  extends Schema.Class<PublicKeyCredentialDescriptorJSON>("PublicKeyCredentialDescriptorJSON")({
    id: Base64URLString,
    type: Schema.Literal("public-key"),
    transports: Schema.optionalWith(MutableArray(AuthenticatorTransportFuture), { exact: true }),
  })
{}

const AuthenticatorAttachment = Schema.Union(
  Schema.Literal("cross-platform"),
  Schema.Literal("platform"),
);

const ResidentKeyRequirement = Schema.Union(
  Schema.Literal("discouraged"),
  Schema.Literal("preferred"),
  Schema.Literal("required"),
);

const UserVerificationRequirement = Schema.Union(
  Schema.Literal("discouraged"),
  Schema.Literal("preferred"),
  Schema.Literal("required"),
);

class AuthenticatorSelectionCriteria
  extends Schema.Class<AuthenticatorSelectionCriteria>("AuthenticatorSelectionCriteria")({
    authenticatorAttachment: Schema.optionalWith(AuthenticatorAttachment, { exact: true }),
    requireResidentKey: Schema.optionalWith(Schema.Boolean, { exact: true }),
    residentKey: Schema.optionalWith(ResidentKeyRequirement, { exact: true }),
    userVerification: Schema.optionalWith(UserVerificationRequirement, { exact: true }),
  })
{}

const PublicKeyCredentialHint = Schema.Union(
  Schema.Literal("hybrid"),
  Schema.Literal("security-key"),
  Schema.Literal("client-device"),
);

const AttestationConveyancePreference = Schema.Union(
  Schema.Literal("direct"),
  Schema.Literal("enterprise"),
  Schema.Literal("indirect"),
  Schema.Literal("none"),
);

const AttestationFormat = Schema.Union(
  Schema.Literal("fido-u2f"),
  Schema.Literal("packed"),
  Schema.Literal("android-safetynet"),
  Schema.Literal("android-key"),
  Schema.Literal("tpm"),
  Schema.Literal("apple"),
  Schema.Literal("none"),
);

class AuthenticationExtensionsClientInputs
  extends Schema.Class<AuthenticationExtensionsClientInputs>("AuthenticationExtensionsClientInputs")({
    appid: Schema.optionalWith(Schema.String, { exact: true }),
    credProps: Schema.optionalWith(Schema.Boolean, { exact: true }),
    hmacCreateSecret: Schema.optionalWith(Schema.Boolean, { exact: true }),
    minPinLength: Schema.optionalWith(Schema.Boolean, { exact: true }),
  })
{}

export class WebAuthnCredential extends Schema.Class<WebAuthnCredential>("WebAuthnCredential")({
  id: Base64URLString,
  publicKey: Schema.Uint8Array,
  counter: Schema.Number,
  transports: Schema.optionalWith(MutableArray(AuthenticatorTransportFuture), { exact: true }),
}) {}

class AuthenticatorAssertionResponseJSON
  extends Schema.Class<AuthenticatorAssertionResponseJSON>("AuthenticatorAssertionResponseJSON")({
    clientDataJSON: Base64URLString,
    authenticatorData: Base64URLString,
    signature: Base64URLString,
    userHandle: Schema.optionalWith(Base64URLString, { exact: true }),
    attestationObject: Schema.optionalWith(Base64URLString, { exact: true }),
  })
{}

export class AuthenticationResponseJSON extends Schema.Class<AuthenticationResponseJSON>("AuthenticationResponseJSON")({
  id: Base64URLString,
  rawId: Base64URLString,
  response: AuthenticatorAssertionResponseJSON,
  authenticatorAttachment: Schema.optionalWith(
    Schema.Union(Schema.Literal("cross-platform"), Schema.Literal("platform")),
    { exact: true },
  ),
  clientExtensionResults: AuthenticationExtensionsClientOutputs,
  type: Schema.Literal("public-key"),
}) {}

export class PublicKeyCredentialRequestOptionsJSON
  extends Schema.Class<PublicKeyCredentialRequestOptionsJSON>("PublicKeyCredentialRequestOptionsJSON")({
    challenge: Base64URLString,
    timeout: Schema.optional(Schema.Number),
    rpId: Schema.optional(Schema.String),
    allowCredentials: Schema.optional(MutableArray(PublicKeyCredentialDescriptorJSON)),
    userVerification: Schema.optional(UserVerificationRequirement),
    hints: Schema.optional(MutableArray(PublicKeyCredentialHint)),
    extensions: Schema.optional(AuthenticationExtensionsClientInputs),
  })
{}

export class PublicKeyCredentialCreationOptionsJSON
  extends Schema.Class<PublicKeyCredentialCreationOptionsJSON>("PublicKeyCredentialCreationOptionsJSON")({
    rp: PublicKeyCredentialRpEntity,
    user: PublicKeyCredentialUserEntityJSON,
    challenge: Base64URLString,
    pubKeyCredParams: MutableArray(PublicKeyCredentialParameters),
    timeout: Schema.optionalWith(Schema.Number, { exact: true }),
    excludeCredentials: Schema.optionalWith(MutableArray(PublicKeyCredentialDescriptorJSON), { exact: true }),
    authenticatorSelection: Schema.optionalWith(AuthenticatorSelectionCriteria, { exact: true }),
    hints: Schema.optionalWith(MutableArray(PublicKeyCredentialHint), { exact: true }),
    attestation: Schema.optionalWith(AttestationConveyancePreference, { exact: true }),
    attestationFormats: Schema.optionalWith(MutableArray(AttestationFormat), { exact: true }),
    extensions: Schema.optionalWith(AuthenticationExtensionsClientInputs, { exact: true }),
  })
{}

export class RegistrationInfo extends Schema.Class<RegistrationInfo>("RegistrationInfo")({
  aaguid: Base64URLString,
  attestationObject: Schema.Uint8Array,
  credential: WebAuthnCredential,
  credentialBackedUp: Schema.Boolean,
  credentialDeviceType: Schema.Union(Schema.Literal("singleDevice"), Schema.Literal("multiDevice")),
  credentialType: Schema.Literal("public-key"),
  fmt: AttestationFormat,
  origin: Schema.String,
  rpID: Schema.optional(Schema.String),
  userVerified: Schema.Boolean,
}) {}

export const RegistrationInfoFromBase64 = Schema.compose(
  Schema.StringFromBase64,
  Schema.parseJson(RegistrationInfo),
);
