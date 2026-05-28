'use client'
// @/custom/Components/Admin/ImportMarkdownButton.tsx
//
// "Import Markdown" affordance that is rendered as a UI field above the
// rich-text body on the Post edit page.
//
// Flow:
//   1. The editor opens the drawer and pastes a markdown document
//      (frontmatter optional).
//   2. We POST the raw markdown to /api/import-markdown. The server uses
//      Payload's `convertMarkdownToLexical` to build a serialized Lexical
//      editor state using the exact same feature set as the live body
//      editor, and parses the YAML frontmatter scalars.
//   3. We dispatch UPDATE actions against the form for each populatable
//      field. Setting BOTH `value` and `initialValue` on the body field is
//      required to force the Lexical editor to re-mount with the imported
//      state -- the Field component compares `initialValue` by reference to
//      decide when to swap in a fresh editor instance.
//
// Headings, paragraphs, lists, blockquotes, code fences, links, GFM tables
// and horizontal rules all round-trip into native Lexical nodes. The
// `textAndImage` / `cards` component blocks remain available in the editor
// toolbar -- the import keeps the body editable so the author can swap in
// component blocks where they want them.
import React, { useCallback, useState } from 'react'
import {
  Button,
  Drawer,
  DrawerToggler,
  toast,
  useForm,
  useModal,
} from '@payloadcms/ui'

const DRAWER_SLUG = 'posts-import-markdown'

type ImportResponse = {
  body: unknown
  frontmatter: Record<string, string | number | boolean>
  schema?: unknown | null
}

type FrontmatterUpdate = {
  fmKey: string
  path: string
}

// Maps frontmatter keys (left) to form field paths (right). Keys that are
// missing from the pasted document are simply skipped, so adding a new
// mapping is safe even when only some posts include that key.
//
// Note on `slug`: the slug field is paired with a `generateSlug` checkbox
// that, when true, regenerates the slug from the title on save. After we
// set an explicit slug from frontmatter we also flip `generateSlug` to
// false so the imported slug is preserved.
const FRONTMATTER_FIELD_MAP: FrontmatterUpdate[] = [
  { fmKey: 'title', path: 'title' },
  { fmKey: 'slug', path: 'slug' },
  { fmKey: 'meta_description', path: 'summary' },
  { fmKey: 'meta_title', path: 'meta.title' },
  { fmKey: 'meta_description', path: 'meta.description' },
]

export const ImportMarkdownButton: React.FC = () => {
  const { dispatchFields, setModified } = useForm()
  const { closeModal } = useModal()
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)

  const handleImport = useCallback(async () => {
    if (!markdown.trim()) {
      toast.error('Paste some markdown first.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/import-markdown', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(errBody.error ?? `Import failed (${res.status})`)
      }

      const data = (await res.json()) as ImportResponse

      // The body field needs `value` AND `initialValue` to be replaced --
      // the Lexical Field component watches `initialValue` (by reference)
      // to decide when to re-mount the editor with a fresh state. See
      // node_modules/@payloadcms/richtext-lexical/dist/field/Field.js.
      dispatchFields({
        type: 'UPDATE',
        path: 'body',
        value: data.body,
        initialValue: data.body,
      })

      const fm = data.frontmatter ?? {}
      let populatedCount = 0
      for (const { fmKey, path } of FRONTMATTER_FIELD_MAP) {
        const raw = fm[fmKey]
        if (raw === undefined || raw === null || raw === '') continue
        dispatchFields({
          type: 'UPDATE',
          path,
          value: String(raw),
          initialValue: String(raw),
        })
        populatedCount += 1
      }

      // Lock the imported slug from being regenerated on save when the user
      // pasted an explicit `slug:` in frontmatter.
      if (fm.slug) {
        dispatchFields({
          type: 'UPDATE',
          path: 'generateSlug',
          value: false,
          initialValue: false,
        })
      }

      // Lift any JSON-LD block the server pulled out of the markdown into
      // SEO -> Schema. The server returns `null` when no schema.org block
      // was present, in which case we leave the existing meta.schema alone.
      const importedSchema = data.schema ?? null
      if (importedSchema !== null) {
        dispatchFields({
          type: 'UPDATE',
          path: 'meta.schema',
          value: importedSchema,
          initialValue: importedSchema,
        })
      }

      setModified(true)

      const fmSummary =
        populatedCount > 0
          ? `${populatedCount} frontmatter field${
              populatedCount === 1 ? '' : 's'
            }`
          : ''
      const schemaSummary = importedSchema !== null ? '1 JSON-LD schema' : ''
      const extras = [fmSummary, schemaSummary].filter(Boolean).join(' and ')
      toast.success(
        extras
          ? `Imported markdown body and ${extras}. Review and save.`
          : 'Imported markdown into the body. Review and save.',
      )
      closeModal(DRAWER_SLUG)
      setMarkdown('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import.')
    } finally {
      setBusy(false)
    }
  }, [markdown, dispatchFields, setModified, closeModal])

  return (
    <div
      style={{
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <DrawerToggler
        slug={DRAWER_SLUG}
        className="btn btn--style-secondary btn--size-small"
        disabled={busy}
      >
        Import Markdown
      </DrawerToggler>
      <span
        style={{
          fontSize: '0.78rem',
          color: 'var(--theme-elevation-500, #6b7280)',
        }}
      >
        Paste a markdown document to populate the body, SEO fields (from
        frontmatter) and SEO &rarr; Schema (from any JSON-LD ```json
        block). Existing content will be overwritten.
      </span>

      <Drawer slug={DRAWER_SLUG} title="Import Markdown" gutter>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
            Paste a markdown document below. Headings, paragraphs, lists,
            blockquotes, code fences, links, horizontal rules and GFM tables
            are converted into native editor blocks. If a YAML frontmatter
            block is present, <code>title</code>, <code>slug</code>,{' '}
            <code>meta_title</code> and <code>meta_description</code> will
            populate the matching post fields. A <code>```json</code> block
            that contains <code>schema.org</code> JSON-LD is lifted into{' '}
            <em>SEO &rarr; Schema</em> and removed from the body. Component
            blocks (<em>Text and Image</em>, <em>Cards</em>) remain available
            in the editor toolbar to insert where you want them.
          </p>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Paste markdown here..."
            disabled={busy}
            rows={20}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: 360,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--style-radius-m, 4px)',
              border: '1px solid var(--theme-elevation-200, #d1d5db)',
              resize: 'vertical',
              background: 'var(--theme-input-bg, white)',
              color: 'var(--theme-text, black)',
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              type="button"
              buttonStyle="secondary"
              size="medium"
              disabled={busy}
              onClick={() => {
                closeModal(DRAWER_SLUG)
                setMarkdown('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              buttonStyle="primary"
              size="medium"
              disabled={busy || !markdown.trim()}
              onClick={handleImport}
            >
              {busy ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default ImportMarkdownButton
