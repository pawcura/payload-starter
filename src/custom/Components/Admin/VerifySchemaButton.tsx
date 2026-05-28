'use client'
// @/custom/Components/Admin/VerifySchemaButton.tsx
//
// Renders a "Verify Schema" affordance directly below the SEO -> Schema
// JSON-LD field. The button performs lightweight, in-browser structural
// checks against the current `meta.schema` form value:
//
//   * The value parses as JSON / is a plain object.
//   * `@context` references `schema.org` (string or array form).
//   * Either a root-level `@type` is set, OR `@graph` is an array of typed
//     entries.
//   * No unresolved `{{TEMPLATE_PLACEHOLDERS}}` remain (the seed examples we
//     ship include placeholders such as `{{AUTHOR_NAME}}`).
//
// When verification passes (no errors), the SHA-256 of the current schema
// JSON is dispatched into the hidden `meta.schemaVerifiedHash` form field.
// The Post `workflowTransition` hook recomputes the same hash server-side
// at publish time and refuses the "approved -> published" move unless the
// stored hash still matches the current schema -- so any edit to the
// schema automatically invalidates verification.
//
// A small badge next to the buttons reflects the live state ("Verified",
// "Not Verified", or "No schema") so editors don't have to re-click to
// know where they stand.
import React, { useCallback, useEffect, useState } from 'react'
import { Button, toast, useField, useForm } from '@payloadcms/ui'
// IMPORTANT: import the *client* implementation here. The server-side
// `@/utils/schemaHash` statically imports `node:crypto`, which webpack
// cannot bundle for the browser (UnhandledSchemeError).
import { schemaHash } from '@/utils/schemaHash.client'

const SCHEMA_PATH = 'meta.schema'
const HASH_PATH = 'meta.schemaVerifiedHash'
const EXTERNAL_VALIDATOR_URL = 'https://validator.schema.org/'

type Issue = { level: 'error' | 'warning'; message: string }

const collectIssues = (raw: unknown): Issue[] => {
  const issues: Issue[] = []

  if (raw === null || raw === undefined || raw === '') {
    issues.push({ level: 'error', message: 'Schema field is empty.' })
    return issues
  }

  // Payload's `json` field stores the parsed value, but be defensive: if a
  // string slipped through (e.g. from a partially-saved draft), try to parse
  // it before structural checks.
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch (err) {
      issues.push({
        level: 'error',
        message: `Invalid JSON: ${(err as Error).message}`,
      })
      return issues
    }
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push({
      level: 'error',
      message: 'Top-level value must be a JSON object (not an array or scalar).',
    })
    return issues
  }

  const obj = value as Record<string, unknown>

  const ctx = obj['@context']
  const ctxOk =
    (typeof ctx === 'string' && ctx.includes('schema.org')) ||
    (Array.isArray(ctx) &&
      ctx.some((c) => typeof c === 'string' && c.includes('schema.org')))
  if (!ctxOk) {
    issues.push({
      level: 'error',
      message: '"@context" is missing or does not reference schema.org.',
    })
  }

  const graph = obj['@graph']
  if (Array.isArray(graph)) {
    if (graph.length === 0) {
      issues.push({ level: 'warning', message: '"@graph" is an empty array.' })
    }
    graph.forEach((entry, idx) => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        issues.push({
          level: 'error',
          message: `@graph[${idx}] is not a JSON object.`,
        })
        return
      }
      const e = entry as Record<string, unknown>
      if (!e['@type']) {
        issues.push({
          level: 'error',
          message: `@graph[${idx}] is missing "@type".`,
        })
      }
    })
  } else if (graph !== undefined) {
    issues.push({
      level: 'error',
      message: '"@graph" is present but is not an array.',
    })
  } else if (!obj['@type']) {
    issues.push({
      level: 'error',
      message:
        '"@type" is missing on the root object (or wrap entries inside an "@graph" array).',
    })
  }

  const stringified = JSON.stringify(value)
  const placeholders = stringified.match(/\{\{[A-Z0-9_]+\}\}/g)
  if (placeholders && placeholders.length > 0) {
    const unique = Array.from(new Set(placeholders))
    issues.push({
      level: 'warning',
      message: `Unresolved template placeholders: ${unique.join(', ')}.`,
    })
  }

  return issues
}

const formatIssues = (issues: Issue[]): string =>
  issues.map((i) => `\u2022 ${i.message}`).join('\n')

type BadgePalette = { text: string; bg: string; fg: string; border: string }

const NO_SCHEMA: BadgePalette = {
  text: 'No schema',
  bg: '#f3f4f6',
  fg: '#374151',
  border: '#d1d5db',
}
const VERIFIED: BadgePalette = {
  text: 'Verified',
  bg: '#dcfce7',
  fg: '#166534',
  border: '#86efac',
}
const NOT_VERIFIED: BadgePalette = {
  text: 'Not Verified',
  bg: '#fee2e2',
  fg: '#991b1b',
  border: '#fca5a5',
}
const CHECKING: BadgePalette = {
  text: 'Checking…',
  bg: '#f3f4f6',
  fg: '#374151',
  border: '#d1d5db',
}

export const VerifySchemaButton: React.FC = () => {
  const { dispatchFields } = useForm()
  const { value: schemaValue } = useField<unknown>({ path: SCHEMA_PATH })
  const { value: storedHash } = useField<string>({ path: HASH_PATH })
  const [currentHash, setCurrentHash] = useState<string | null>(null)

  // Recompute the hash of the live schema value whenever it changes so the
  // badge updates the moment the editor saves a keystroke through the JSON
  // editor (or autosave swaps in the persisted value on first load).
  useEffect(() => {
    let cancelled = false
    setCurrentHash(null)
    void (async () => {
      const h = await schemaHash(schemaValue ?? null)
      if (!cancelled) setCurrentHash(h)
    })()
    return () => {
      cancelled = true
    }
  }, [schemaValue])

  const hasSchema =
    schemaValue !== null && schemaValue !== undefined && schemaValue !== ''

  let badge: BadgePalette
  if (!hasSchema) {
    badge = NO_SCHEMA
  } else if (currentHash === null) {
    badge = CHECKING
  } else if (currentHash && storedHash && currentHash === storedHash) {
    badge = VERIFIED
  } else {
    badge = NOT_VERIFIED
  }

  const handleVerify = useCallback(async () => {
    const issues = collectIssues(schemaValue)
    const errors = issues.filter((i) => i.level === 'error')
    const warnings = issues.filter((i) => i.level === 'warning')

    if (errors.length > 0) {
      toast.error(
        `Schema has ${errors.length} issue${
          errors.length === 1 ? '' : 's'
        }:\n${formatIssues(errors)}`,
      )
      return
    }

    const hash = await schemaHash(schemaValue ?? null)
    dispatchFields({
      type: 'UPDATE',
      path: HASH_PATH,
      value: hash,
      initialValue: hash,
    })

    if (warnings.length === 0) {
      toast.success(
        'Schema verified. You can now move this post to Published once approved.',
      )
    } else {
      toast.success(
        `Schema verified with ${warnings.length} warning${
          warnings.length === 1 ? '' : 's'
        }:\n${formatIssues(warnings)}`,
      )
    }
  }, [schemaValue, dispatchFields])

  const handleOpenExternal = useCallback(async () => {
    if (hasSchema) {
      try {
        const text =
          typeof schemaValue === 'string'
            ? schemaValue
            : JSON.stringify(schemaValue, null, 2)
        await navigator.clipboard?.writeText?.(text)
        toast.success(
          'Copied schema JSON to clipboard. Paste it into the "Code Snippet" tab on validator.schema.org.',
        )
      } catch {
        // Clipboard access can be denied (e.g. permissions, insecure
        // context). Fall through and still open the validator.
      }
    }
    window.open(EXTERNAL_VALIDATOR_URL, '_blank', 'noopener,noreferrer')
  }, [hasSchema, schemaValue])

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        marginTop: '-0.5rem',
        marginBottom: 'var(--base, 1rem)',
      }}
    >
      <Button
        type="button"
        buttonStyle="secondary"
        size="small"
        onClick={handleVerify}
      >
        Verify Schema
      </Button>
      <Button
        type="button"
        buttonStyle="tertiary"
        size="small"
        onClick={handleOpenExternal}
      >
        Open Schema.org Validator
      </Button>
      <span
        title={
          badge === VERIFIED
            ? 'The current schema matches the last verified snapshot. This post can be published.'
            : badge === NOT_VERIFIED
              ? 'The schema has been edited since it was verified (or never verified). Click "Verify Schema" before publishing.'
              : badge === NO_SCHEMA
                ? 'No schema JSON-LD has been added yet. Publishing requires a verified schema.'
                : 'Computing schema hash…'
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 600,
          lineHeight: 1.2,
          backgroundColor: badge.bg,
          color: badge.fg,
          border: `1px solid ${badge.border}`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '0.45rem',
            height: '0.45rem',
            borderRadius: '9999px',
            backgroundColor: badge.fg,
          }}
        />
        {badge.text}
      </span>
      <span
        style={{
          fontSize: '0.75rem',
          lineHeight: 1.4,
          color: 'var(--theme-elevation-500, #6b7280)',
        }}
      >
        Runs structural checks (@context, @type, @graph, placeholders) and
        stamps the schema as verified. Editing the schema after verification
        invalidates the stamp; posts cannot be moved to Published without a
        current "Verified" badge.
      </span>
    </div>
  )
}

export default VerifySchemaButton
