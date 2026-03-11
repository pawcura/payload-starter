import Image from 'next/image'
import type { Media } from '@/payload-types'
import { getMediaSize } from '@/utilities/getMediaSize'
import classes from './index.module.css'

type MediaImageProps = {
  image: Media
  size?: keyof NonNullable<Media['sizes']>
  flex?: boolean
  className?: string
}

export function MediaImage({ image, size, flex, className, ...rest }: MediaImageProps & React.HTMLAttributes<HTMLDivElement>) {
  const classNames = [classes.imageWrapper, flex && classes.flex, className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classNames} {...rest}>
      <Image
        src={getMediaSize(image, size).url!}
        alt={image.alt || ''}
        width={getMediaSize(image, size).width!}
        height={getMediaSize(image, size).height!}
        blurDataURL={image.blurDataUrl!}
        placeholder="blur"
      />
    </div>
  )
}
