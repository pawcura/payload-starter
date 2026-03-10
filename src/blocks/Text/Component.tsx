// @/blocks/Text/Component.tsx
import { RichText } from '@/components/RichText'
import type { TextBlockProps } from '@/payload-types'
import { Section } from '@/components/Section'
import { Header } from '@/components/Header'
import { Body } from '@/components/Body'
import { Container } from '@/components/Container'

export const TextBlock = (props: TextBlockProps) => {
  // we won't need to do any styles here, it's all handled by our reusable components
  const { header, backgroundColor, body } = props
  return (
    <Section>
      {/* add the container wrapper */}
      <Container>
        {/* unwrap this header from its div */}
        {header && <Header>{header}</Header>}
        {/* change this to the body component */}
        <Body>
          <RichText data={body} />
        </Body>
      </Container>
    </Section>
  )
}
