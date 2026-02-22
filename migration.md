# Migration Notes

Track temporary removals made during the Effect v4 migration so they are restored after the definition/implementation passes.

## Temporary removals

- Simplified `RegistrationInfoFromBase64` in `src/effect/shared/webauthn.ts`:
  - Replaced old base64+json composition with `Schema.fromJsonString(RegistrationInfo)` during schema API migration
  - This temporarily changes wire/storage encoding expectations from base64-json to plain json-string


## Why this was removed

- `Schema` composition APIs changed in v4, and the old base64+json helper chain was removed during the schema migration pass.

## Restore checklist

- Restore base64 round-trip behavior for `RegistrationInfoFromBase64` after schema migration settles.
- Verify `PASSKEY_*` config values and `registerVerify` credential codes remain backward compatible.


## Related files to revisit

- `src/effect/shared/webauthn.ts`
