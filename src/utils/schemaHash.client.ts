// @/utils/schemaHash.client.ts
//
// CLIENT-ONLY counterpart to `./schemaHash.ts`. Computes the stable hex
// SHA-256 of a JSON-serialisable value using Web Crypto, which is exposed
// on `window.crypto.subtle` in every browser we target. Used by the
// VerifySchemaButton admin component to fingerprint the live schema field
// value (for both the "Verify" stamp and the live Verified / Not Verified
// badge).
//
// The implementation intentionally mirrors `schemaHash.ts` byte-for-byte
// modulo the underlying API call -- both produce the same hex output for
// the same input. If they ever drift, the publish-gate hook on Posts will
// reject every transition into "published" because the server-side rehash
// will not match the client-side stamp.

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

export const schemaHash = async (value: unknown): Promise<string> => {
  if (value === null || value === undefined || value === '') return ''
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(stringify(value)),
  )
  return toHex(buf)
}
