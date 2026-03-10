import { internalDocToHref } from './internalLink'
import { uploadConverter } from './uploadConverter'
import { type JSXConvertersFunction, LinkJSXConverter } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { CardsBlockProps, TextAndImageBlockProps } from '@/payload-types'
import { CardBlock } from '@/blocks/Cards/Component'
import { TextAndImage } from '@/blocks/TextAndImage/Component'
import { Section } from '@/components/Section'
import { Container } from '@/components/Container'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<TextAndImageBlockProps | CardsBlockProps>

export const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  upload: ({ node }) => {
    return uploadConverter({ uploadNode: node })
  },
  blocks: {
    cards: ({ node }) => <CardBlock {...node.fields} />,
    textAndImage: ({ node }) => <TextAndImage {...node.fields} />,
  },
})
