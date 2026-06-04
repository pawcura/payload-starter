// @/collections/Posts/bodyEditor.ts
//
// The Lexical feature set for the Post `body` field is defined here so it can
// be reused in two places that must stay in lockstep:
//
//   1. The Posts collection config (the live editor in the admin UI).
//   2. The /api/import-markdown endpoint (server-side markdown -> Lexical
//      conversion). The conversion uses a headless Lexical editor and must
//      know about exactly the same set of nodes/transformers as the live
//      editor, otherwise the imported document fails the field's schema
//      validation.
//
// `EXPERIMENTAL_TableFeature` is added so GFM-style markdown tables in the
// pasted document round-trip into real Lexical TableNodes instead of being
// flattened to paragraphs.

import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

// The concrete feature-provider type from `@payloadcms/richtext-lexical` is
// not re-exported from the package entry point, so we type the arguments as
// `any[]` and let the library validate the array shape at the call sites
// (lexicalEditor for the live editor and editorConfigFactory.fromFeatures
// for the headless conversion used by the markdown import endpoint).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureProvider = any

export const postsBodyEditorFeatures = ({
  defaultFeatures,
}: {
  defaultFeatures: FeatureProvider[]
  rootFeatures: FeatureProvider[]
}): FeatureProvider[] => [
  ...defaultFeatures,
  FixedToolbarFeature(),
  EXPERIMENTAL_TableFeature(),
  BlocksFeature({
    blocks: ['textAndImage', 'cards'],
  }),
]

export const postsBodyEditor = lexicalEditor({
  features: postsBodyEditorFeatures,
})
