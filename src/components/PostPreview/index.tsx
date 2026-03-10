// @/components/PostPreview/index.tsx
import Link from 'next/link'
import { Post, Media, User, Category } from '@/payload-types'
import { isDoc } from '@/utilities/isDoc'
import { MediaImage } from '@/components/MediaImage'
import { Header } from '@/components/Header'
import classes from './index.module.css'
import { Calendar, Tag, User2 } from 'lucide-react'

// we'll define our post preview props here using the Pick utility type to get what we need from the Post
type PostPreviewProps = {
  post: Pick<
    Post,
    | 'id'
    | 'slug'
    | 'title'
    | 'summary'
    | 'featuredImage'
    | 'populatedAuthor'
    | 'date'
    | 'date_tz'
    | 'category'
  >
  // we'll want an optional variant and showLink prop to control the flow and function of the component
  variant?: 'featured' | 'header'
  showLink?: boolean
  // and lastly, optional imageSize and className props
  imageSize?: 'fullSize' | 'card'
  className?: string
}

// export this as a function
export function PostPreview({
  // we'll pull out the props we need from the PostPreviewProps type
  post,
  // and set a few defaults
  variant = 'featured',
  showLink = true,
  imageSize = 'fullSize',
  className,
}: PostPreviewProps) {
  // we'll destructure our post
  const { featuredImage, populatedAuthor: author, date, date_tz, category, title, summary, slug } = post

  // and process our class names
  const classNames = [classes.header, className].filter(Boolean).join(' ')

  // set a new constant called content
  const content = (
    // and pass in the classes we need as we go
    <div className={classNames}>
      {/* we'll use the MediaImage component from earlier using a variable imageSize */}
      {isDoc<Media>(featuredImage) && <MediaImage image={featuredImage} size={imageSize} />}
      {/* then we'll rearrange our content section */}
      <div className={classes.content}>
        {/* when we have a featured variant, we'll use the Header component with the title prop */}
        {/* I don't want this when the section is used as a header on the individual post, that should be a separate h1 */}
        {variant === 'featured' && (
          <Header as={'h3'} align="left" className={classes.title}>
            {title}
          </Header>
        )}
        {/* then we'll need our meta section */}
        <div className={classes.meta}>
          {/* to pass in the author, category, and date */}
          {isDoc<User>(author) && (
            <span
              className={classes.iconContainer}
            >
              <User2 height={16} width={16} /> {author.name}
            </span>
          )}
          {isDoc<Category>(category) && (
            <span className={classes.iconContainer}>
              <Tag height={16} width={16} /> {category.name}
            </span>
          )}
          {date && (
            <span className={classes.iconContainer}>
              <Calendar height={16} width={16} />
              {new Date(date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: date_tz,
              })}
            </span>
          )}
        </div>
        {/* lastly, we'll return the summary */}
        {summary && <p className={classes.summary}>{summary}</p>}
      </div>
    </div>
  )

  // if we want to allow this to be clickable, we can return the content in a Link component
  if (showLink) {
    return (
      <Link href={`/blog/${slug}`} className={classes.link}>
        {content}
      </Link>
    )
  }
  // if not, we'll return the content
  return content
}

