import { timingSafeEqual } from 'crypto'
import type { PayloadRequest } from 'payload'

function safeEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(providedBuf, expectedBuf)
}

/** Shared secret for headless frontends (e.g. Pawcura) to read published CMS content. */
export function getCmsReadApiKey(): string | undefined {
  const key = process.env.CMS_READ_API_KEY?.trim()
  return key || undefined
}

export function hasValidCmsReadApiKey(req: PayloadRequest): boolean {
  const expected = getCmsReadApiKey()
  if (!expected) return false

  const headerKey = req.headers.get('x-cms-read-key')?.trim()
  if (headerKey && safeEqual(headerKey, expected)) return true

  const authorization = req.headers.get('authorization')?.trim()
  if (!authorization) return false

  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization)
  if (bearerMatch?.[1] && safeEqual(bearerMatch[1].trim(), expected)) return true

  return false
}

export function canReadCmsContent(req: PayloadRequest): boolean {
  return Boolean(req.user) || hasValidCmsReadApiKey(req)
}
