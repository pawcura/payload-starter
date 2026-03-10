import { TextBlock } from '@/blocks/Text/Component'
import { Hero } from '@/blocks/Hero/Component'
import { Page } from '@/payload-types'
import React from 'react'
import { TextAndImage } from '@/blocks/TextAndImage/Component'
import { CardBlock } from '@/blocks/Cards/Component'
import { Section } from '@/components/Section'
import { Container } from '@/components/Container'

const blockComponents = {
  text: TextBlock,
  hero: Hero,
  textAndImage: TextAndImage,
  cards: CardBlock,
}

export const Blocks: React.FC<{
  blocks: Page['blocks']
}> = ({ blocks }) => {
  if (!blocks?.length) return null

  return (
    <>
      {blocks.map((block) => {
        const { blockType, id } = block

        if (!blockType || !(blockType in blockComponents)) return null

        switch (blockType) {
          case 'text':
            return <TextBlock key={id} {...block} />
          case 'hero':
            return <Hero key={id} {...block} />
          case 'textAndImage':
            return <TextAndImage key={id} {...block} />
          case 'cards':
            return <CardBlock key={id} {...block} />
          default:
            return null
        }
      })}
    </>
  )
}
