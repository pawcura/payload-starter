// @/components/CardContainer/index.tsx
import React from 'react'
// import classes
import classes from './index.module.css'

// we'll add a new type to determine our variant
type CardContainerVariant = 'default' | 'compact'

// and change our types
type CardContainerProps = {
  children: React.ReactNode
  variant?: CardContainerVariant
  className?: string
}

export const CardContainer = ({ children, variant = 'default', className }: CardContainerProps) => {
  // process the class names to ensure no whitespace or undefined classes
  const classNames = [classes.grid, className].filter(Boolean).join(' ')

  // we'll adjust our card container component to first define what variant we're using
  // by mapping through the children and cloning them with the variant prop if it's a valid element
  const childrenWithVariant = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { variant } as React.HTMLAttributes<HTMLElement>)
    }
    // if not, we can return the child as is
    return child
  })

  // then we can return the div with the processed class names and variant child
  return <div className={classNames}>{childrenWithVariant}</div>
}
