// @/endpoints/importMarkdown.ts
//
// POST /api/import-markdown
//
// Accepts a raw markdown document (typically with YAML frontmatter) and
// returns the pieces needed to hydrate a Post draft in the admin UI:
//
//   - `frontmatter`: a plain object of the top-level YAML scalars.
//   - `body`: a serialized Lexical editor state, built using the exact same
//     feature set as the Posts body field, so it can be set straight on the
//     form's body field without re-running through the Lexical editor.
//
// The conversion uses Payload's `convertMarkdownToLexical` helper, which
// runs a headless Lexical editor against the registered markdown transformers
// (paragraphs, headings, lists, links, code, blockquotes, horizontal rules,
// and -- via EXPERIMENTAL_TableFeature -- GFM tables).
//
// Notes on pre-processing:
//   * Markdown content from the CMS team often contains raw HTML for things
//     like inline links and paragraph wrappers. Lexical's markdown
//     transformers do not understand HTML, so we lightly normalise a handful
//     of common tags into their markdown equivalents before conversion.
//   * Authentication is required. The export does not check role because any
//     signed-in editor who can already create a Post should be able to seed
//     its draft body.

import type { Endpoint } from 'payload'

import {
  convertMarkdownToLexical,
  editorConfigFactory,
  extractFrontmatter,
} from '@payloadcms/richtext-lexical'

import { postsBodyEditorFeatures } from '@/collections/Posts/bodyEditor'

const jsonError = (message: string, status: number) =>
  Response.json({ error: message }, { status })

/**
 * Lightweight YAML reader for the *top-level scalar* keys of a frontmatter
 * block. Intentionally ignores nested lists / mappings (we only need a few
 * scalars to populate sibling fields). Handles single-quoted, double-quoted
 * and unquoted values, plus boolean / number coercion for numeric values.
 */
const parseFrontmatterScalars = (
  frontmatterBlock: string,
): Record<string, string | number | boolean> => {
  const result: Record<string, string | number | boolean> = {}
  // Strip the leading / trailing `---` fences if present.
  const stripped = frontmatterBlock
    .replace(/^---\s*\n?/, '')
    .replace(/\n?---\s*$/, '')

  for (const rawLine of stripped.split('\n')) {
    // Skip continuation / nested lines (indented) and blank / comment lines.
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue
    if (/^\s/.test(rawLine)) continue

    const match = rawLine.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if (!value) continue

    // Strip inline comments after an unquoted value.
    if (!/^['"]/.test(value)) {
      const hashIdx = value.indexOf(' #')
      if (hashIdx !== -1) value = value.slice(0, hashIdx).trim()
    }

    // Unwrap single / double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (value === 'true') {
      result[key] = true
    } else if (value === 'false') {
      result[key] = false
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      result[key] = Number(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Decide whether a parsed JSON value looks like schema.org JSON-LD. We accept
 * both the canonical single-object shape (`{ "@context": "https://schema.org", ... }`)
 * and the less common array-context shape
 * (`{ "@context": ["https://schema.org", ...], ... }`). Substring matching on
 * `schema.org` covers `http://`, `https://` and trailing slashes.
 */
const isSchemaOrgJsonLd = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false
  const ctx = (value as Record<string, unknown>)['@context']
  if (typeof ctx === 'string') return ctx.includes('schema.org')
  if (Array.isArray(ctx)) {
    return ctx.some((c) => typeof c === 'string' && c.includes('schema.org'))
  }
  return false
}

/**
 * Locate the first ```json fenced block whose parsed contents look like
 * schema.org JSON-LD, return the parsed value, and strip that single block
 * from the markdown so it does not flow into the Lexical body. Non-JSON-LD
 * `\`\`\`json` blocks and malformed JSON are left in the body untouched.
 */
const extractJsonLdBlock = (
  md: string,
): { schema: unknown | null; markdown: string } => {
  // Match ```json ... ``` fences. The language tag is case-insensitive and
  // may be followed by whitespace on the opening line. `[\s\S]*?` is a
  // non-greedy match so adjacent blocks are not collapsed together.
  const fenceRegex = /```json[^\n]*\n([\s\S]*?)```/gi
  let match: RegExpExecArray | null

  while ((match = fenceRegex.exec(md)) !== null) {
    const raw = match[1]
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue
    }
    if (!isSchemaOrgJsonLd(parsed)) continue

    // Remove this single block (including the surrounding fences) and trim
    // up to two adjacent blank lines so we do not leave an awkward gap.
    const before = md.slice(0, match.index).replace(/\n{2,}$/, '\n\n')
    const after = md.slice(match.index + match[0].length).replace(/^\n+/, '\n')
    return { schema: parsed, markdown: `${before}${after}` }
  }

  return { schema: null, markdown: md }
}

/**
 * Convert the small set of HTML tags that frequently appear inline in
 * authored markdown (and that Lexical's markdown transformers would otherwise
 * pass through as literal text) into equivalent markdown.
 */
const preprocessMarkdown = (md: string): string => {
  let out = md

  // <a href="X" rel="..." target="...">TEXT</a>  ->  [TEXT](X)
  out = out.replace(
    /<a\s+[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    '[$2]($1)',
  )
  out = out.replace(
    /<a\s+[^>]*href\s*=\s*'([^']+)'[^>]*>([\s\S]*?)<\/a>/gi,
    '[$2]($1)',
  )

  // <strong>/<b> -> ** , <em>/<i> -> *
  out = out.replace(/<\/?(?:strong|b)>/gi, '**')
  out = out.replace(/<\/?(?:em|i)>/gi, '*')

  // <br> -> hard line break (two trailing spaces + newline).
  out = out.replace(/<br\s*\/?>/gi, '  \n')

  // <p>...</p> -> plain paragraph (HTML <p> wrappers are common in pasted
  // intros, but Lexical's markdown transformers cannot parse them).
  out = out.replace(/<p[^>]*>/gi, '')
  out = out.replace(/<\/p>/gi, '\n\n')

  return out
}

type ImportBody = {
  markdown?: unknown
}

export const importMarkdownEndpoint: Endpoint = {
  path: '/import-markdown',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return jsonError('You must be signed in to import markdown.', 401)
    }

    let body: ImportBody = {}
    try {
      body = (await req.json?.()) ?? {}
    } catch {
      body = {}
    }

    const markdown = typeof body.markdown === 'string' ? body.markdown : ''
    if (!markdown.trim()) {
      return jsonError('`markdown` is required.', 400)
    }

    const { content, frontmatter } = extractFrontmatter(markdown)
    const frontmatterObj = frontmatter
      ? parseFrontmatterScalars(frontmatter)
      : {}

    const { schema: extractedSchema, markdown: contentWithoutJsonLd } =
      extractJsonLdBlock(content)

    const processedContent = preprocessMarkdown(contentWithoutJsonLd)

    try {
      const editorConfig = await editorConfigFactory.fromFeatures({
        config: req.payload.config,
        features: postsBodyEditorFeatures,
      })

      const lexicalState = convertMarkdownToLexical({
        editorConfig,
        markdown: processedContent,
      })

      return Response.json({
        frontmatter: frontmatterObj,
        body: lexicalState,
        schema: extractedSchema ?? null,
      })
    } catch (err) {
      req.payload.logger.error(
        { err },
        'import-markdown: failed to convert markdown to Lexical',
      )
      return jsonError(
        err instanceof Error
          ? `Could not convert markdown: ${err.message}`
          : 'Could not convert markdown.',
        500,
      )
    }
  },
}
