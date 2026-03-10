import { CardsBlockProps } from '@/payload-types'
import { RichText } from '@/components/RichText'
import { isDoc } from '@/utilities/isDoc'
import { Media } from '@/payload-types'
import { Section } from '@/components/Section'
// import classes
import classes from './Component.module.css'
import { Body } from '@/components/Body'
import { MediaImage } from '@/components/MediaImage'
import { Header } from '@/components/Header'
import { Container } from '@/components/Container'
import React from 'react'

// add classes to each element

export const CardBlock = (props: CardsBlockProps) => {
  const { cardsArray, header, backgroundColor } = props

  return (
    // change this from a section element to our Section component
    <Section backgroundColor={backgroundColor}>
      <Container>
        {/* and we can pull in the header as well */}
        {header && <Header>{header}</Header>}
        {cardsArray && cardsArray.length > 0 && (
          <div className={classes.grid} data-cards={cardsArray.length}>
            {cardsArray.map((card) => (
              // we'll change this to an article element here because, semantically, this is a self-contained unit
              // this will help screen readers understand that each card is its own thing
              // and not decorative or layout-related; it's important info
              <article className={classes.card} key={card.id}>
                {/* then we'll change our image to the new Media image component */}
                {isDoc<Media>(card.image) && <MediaImage image={card.image} size={'card'} />}
                <div className={classes.content}>
                  <Header className={classes.title} as={'h3'} align={'left'}>
                    {card.title}
                  </Header>
                  {/* and change our body div to a component as well */}
                  <Body>
                    <RichText data={card.body} />
                  </Body>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
