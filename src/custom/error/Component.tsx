'use client'
import type {CheckboxFieldErrorClientComponent} from 'payload'
import {useField} from '@payloadcms/ui'

export const CheckboxError: CheckboxFieldErrorClientComponent = ({path}) => {
  const {showError, errorMessage} = useField({path})
  if (showError) return <div style={{color: 'red'}}>
      {errorMessage}
    </div>
}