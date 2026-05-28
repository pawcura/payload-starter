// @/components/Card/index.tsx
import { Category, Media, Post, User } from '@/payload-types'
import Link from 'next/link'
import { isDoc } from '@/utilities/isDoc'
// import our media image component
import { MediaImage } from '@/components/MediaImage'
// we'll import our classes from the css module
import classes from './index.module.css'
import { Header } from '@/components/Header'
import { BadgeCheck, Calendar, Tag, User2 } from 'lucide-react'
import {
  WORKFLOW_STATUS_LABEL,
  type WorkflowStatus,
} from '@/collections/Posts/workflow/states'

// we'll create a type for our card variant
// do I need to export this?
export type CardVariant = 'default' | 'compact'

type cardProps = Pick<
  Post,
  | 'id'
  | 'slug'
  | 'featuredImage'
  | 'title'
  | 'populatedAuthor'
  | 'date'
  | 'date_tz'
  | 'categories'
  | 'workflowStatus'
> &
  // we also need to add the optional variant and class name types
  {
    variant?: CardVariant
    className?: string
  }

// I'll change my post to get our variant, defaulted to default, the className, and then the post
export const Card = ({ variant = 'default', className, ...post }: cardProps) => {
  // let's process our class names
  const cardClasses = [classes.link, classes.card, classes[variant], className].filter(Boolean).join(' ')

  // The first category in the list is the primary category
  const primaryCategory = Array.isArray(post.categories) ? post.categories[0] : undefined

  // Surface the editorial workflow status. On the public site this is
  // effectively always "Published" (other statuses are filtered out by the
  // blog queries), but rendering it explicitly reinforces trust and lets
  // admin/preview routes reuse the same card.
  const workflowStatus = (post.workflowStatus ?? null) as WorkflowStatus | null

  return (
    // if key is here, remove it and change to an article
    <Link
      href={'/blog/' + post.slug}
      aria-label={`View post ${post.title}`}
      className={cardClasses}
    >
      {/* we'll pass in our link className here and then include a label for screen readers */}
      <article>
        {isDoc<Media>(post.featuredImage) && (
          <div className={classes.imageWrapper}>
            {/* in our imageWrapper, we'll check our variant and return the primary category if it exists */}
            {variant === 'default' && isDoc<Category>(primaryCategory) && (
              <span className={classes.categoryBadge}>
                <Tag height={16} width={16} /> {primaryCategory.name}
              </span>
            )}
            <MediaImage image={post.featuredImage} size="card" />
          </div>
        )}
        <div className={classes.content}>
          {workflowStatus && (
            <span
              className={`${classes.statusBadge} ${classes[`status_${workflowStatus.replace('-', '_')}`] ?? ''}`}
            >
              <BadgeCheck height={14} width={14} />
              {WORKFLOW_STATUS_LABEL[workflowStatus]}
            </span>
          )}
          <Header as={'h3'} align={'left'}>
            {post.title}
          </Header>
          {/* we can wrap the meta information in a div with that class name */}
          <div className={classes.meta}>
            {/* let's change the author p element to a span */}
            {isDoc<User>(post.populatedAuthor) && (
              <span className={classes.iconContainer}>
                <User2 height={16} width={16} />
                {post.populatedAuthor.name}
              </span>
            )}
            {/* and do the same to the date */}
            {post.date && (
              <span className={classes.iconContainer}>
                <Calendar height={16} width={16} />
                {new Date(post.date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: post.date_tz,
                })}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

// remove unused imports