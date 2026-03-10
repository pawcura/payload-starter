import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import React, { JSX } from 'react'
import { jsxConverters } from '@/components/RichText/converters'

type Props = {
  data: SerializedEditorState
} & React.HTMLAttributes<HTMLDivElement>

export function RichText(props: Props): JSX.Element {
  const { className, ...rest } = props
  return <RichTextConverter disableContainer converters={jsxConverters} {...rest} className={className} />
}
