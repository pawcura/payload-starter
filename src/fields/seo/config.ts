import {Field} from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { generateCanonical } from '@/fields/seo/hooks/generateCanonical'

export const SEOField: Field = {
  type: 'group',
  name: 'meta',
  fields: [
    MetaTitleField({
      hasGenerateFn: true,
    }),
    MetaDescriptionField({
      hasGenerateFn: true,
    }),
    MetaImageField({
      relationTo: 'media',
      hasGenerateFn: true,
    }),
    PreviewField({
      hasGenerateFn: true,
    }),
    OverviewField({
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
      imagePath: 'meta.image',
    }),
    {
      type: 'text',
      name: 'canonicalUrl',
      label: 'Canonical URL',
      hooks: {
        beforeChange: [generateCanonical],
      },
    },
    {
      type: 'checkbox',
      name: 'addToSitemap',
      defaultValue: true,
      admin: {
        description: 'Add this page to the sitemap',
      },
    },
    {
      type: 'json',
      name: 'schema',
      label: 'Schema (JSON-LD)',
      admin: {
        description:
          'Structured data (schema.org JSON-LD). Auto-populated by Import Markdown when a ```json block with "@context": "https://schema.org" is present. Rendered as <script type="application/ld+json"> on the public page.',
      },
    },
    {
      name: 'schemaVerify',
      type: 'ui',
      admin: {
        components: {
          Field:
            '@/custom/Components/Admin/VerifySchemaButton.tsx#VerifySchemaButton',
        },
      },
    },
    {
      type: 'text',
      name: 'schemaVerifiedHash',
      admin: {
        hidden: true,
        description:
          'SHA-256 of the schema JSON at the moment the editor clicked "Verify Schema". The publish gate on Posts requires this to match the current schema hash; any edit invalidates verification automatically.',
      },
    },
  ],
}