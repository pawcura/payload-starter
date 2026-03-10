'use client'
import { useEffect, useState } from 'react'

export const SetupGuide = () => {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/pages?limit=1')
      .then((res) => res.json())
      .then((data) => {
        setNeedsSetup(data.totalDocs === 0)
      })
      .catch(() => setNeedsSetup(true))
  }, [])

  if (needsSetup === null || needsSetup === false) return null

  const handleSeed = async () => {
    setSeeding(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      setResult({ success: res.ok, message: data.message })
      if (res.ok) {
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setResult({ success: false, message: 'Failed to connect to the seed endpoint.' })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0' }}>Welcome! Your site needs some initial content.</h3>
      <p style={{ margin: '0 0 16px 0', opacity: 0.8 }}>
        Your database is empty. You can either seed it with sample content to get started quickly, or
        create your own content manually using the collections below.
      </p>

      <div style={{ margin: '0 0 16px 0', opacity: 0.8 }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>To set up manually, you will need:</p>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            A <strong>Home</strong> page (slug: <code>home</code>) — this is your homepage
          </li>
          <li>
            A <strong>Blog</strong> page (slug: <code>blog</code>) — this is your blog index
          </li>
          <li>
            At least one <strong>Media</strong> upload for featured images
          </li>
          <li>
            Update <strong>Settings</strong> (globals) with your site name and description
          </li>
          <li>
            Update <strong>Navigation</strong> (globals) with links to your pages
          </li>
        </ol>
      </div>

      <button
        onClick={handleSeed}
        disabled={seeding}
        style={{
          background: 'var(--theme-elevation-900)',
          color: 'var(--theme-elevation-50)',
          border: 'none',
          borderRadius: '4px',
          padding: '10px 20px',
          cursor: seeding ? 'wait' : 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          opacity: seeding ? 0.7 : 1,
        }}
      >
        {seeding ? 'Seeding...' : 'Seed Database with Sample Content'}
      </button>

      {result && (
        <p
          style={{
            margin: '12px 0 0 0',
            color: result.success ? 'var(--theme-success-500)' : 'var(--theme-error-500)',
            fontWeight: 500,
          }}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
