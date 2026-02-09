import { Schema } from "effect";

/**
 * Re-export of Effect's built-in Uint8ArrayFromBase64 schema.
 * 
 * Decodes base64-encoded strings into Uint8Array and vice versa.
 * This is perfect for Yjs document updates which are binary data.
 * 
 * @example
 * ```ts
 * const encoded = Schema.encodeSync(YjsUpdate)(new Uint8Array([1, 2, 3]))
 * // encoded: "AQID" (base64 string)
 * 
 * const decoded = Schema.decodeSync(YjsUpdate)("AQID")
 * // decoded: Uint8Array [1, 2, 3]
 * ```
 */
export const YjsUpdate = Schema.Uint8ArrayFromBase64;

// Type helpers
export type YjsUpdateType = typeof YjsUpdate.Type;        // Uint8Array
export type YjsUpdateEncoded = typeof YjsUpdate.Encoded;  // string (base64)
