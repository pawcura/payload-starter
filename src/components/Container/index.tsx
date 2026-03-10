import React from 'react'
import classes from './index.module.css'

export const Container = ({children}: {children: React.ReactNode}) => {
  return (
    <div className={classes.container}>
      {children}
    </div>
  )
}