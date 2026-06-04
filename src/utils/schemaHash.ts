// @/utils/schemaHash.ts
//
// SERVER-ONLY. Computes the stable hex SHA-256 of a JSON-serialisable value
// using Node's built-in `crypto` module. Used by the Posts publish-gate hook
// in `workflowTransition.ts` to detect whether the schema field has been
// edited since the editor last clicked "Verify Schema".
//
// Do NOT import this file from a client ("use client") component -- webpack
// cannot resolve the `node:crypto` scheme for browser bundles and the build
// will fail with UnhandledSchemeError. Client code must import the parallel
// implementation in `./schemaHash.client.ts`, which uses Web Crypto.
//
// Both implementations must produce identical hashes for identical inputs;
// we rely on V8's stable insertion-order key iteration in `JSON.stringify`
// for that, matching what Payload's storage layer preserves end-to-end.

import { createHash } from 'node:crypto'

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

export const schemaHash = async (value: unknown): Promise<string> => {
  if (value === null || value === undefined || value === '') return ''
  return createHash('sha256').update(stringify(value)).digest('hex')
}
