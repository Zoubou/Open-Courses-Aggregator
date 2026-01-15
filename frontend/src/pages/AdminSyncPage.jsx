import { useState } from 'react'
import { triggerSync } from '../api/courses'
import { Link } from 'react-router-dom'

export default function AdminSyncPage() {
  const [status, setStatus] = useState('')
  const [loadingSource, setLoadingSource] = useState('')

  async function onSync(source) {
    try {
      setLoadingSource(source)
      setStatus('')
      const res = await triggerSync(source)
      setStatus(res?.message || `Sync started for ${source}.`)
    } catch (e) {
      setStatus('Sync failed. Check backend logs.')
    } finally {
      setLoadingSource('')
    }
  }

  const sources = ['kaggle', 'kaggle2', 'kaggle_coursera', 'kaggle_edx', 'kaggle2_coursera', 'kaggle2_edx', 'kaggle2_udacity']

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1>Admin Sync</h1>
          <p className="muted">Trigger harvester sync for a source (runs on backend)</p>
        </div>
        <Link to="/app" className="button secondary" style={{ textDecoration: 'none' }}>
          ← Back to Courses
        </Link>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Sources</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sources.map((s) => (
            <button
              key={s}
              className="button"
              type="button"
              onClick={() => onSync(s)}
              disabled={!!loadingSource}
            >
              {loadingSource === s ? `Syncing ${s}…` : `Sync ${s}`}
            </button>
          ))}
        </div>

        {status && <p style={{ marginTop: 12 }}>{status}</p>}

        <p className="muted" style={{ marginTop: 12 }}>
          Note: Sync returns immediately (202 Accepted) and continues in the backend.
        </p>
      </div>
    </div>
  )
}
