import { useState } from 'react'
import client from '../api/client'
import { Link } from 'react-router-dom'

export default function AdminSyncPage() {
  const [status, setStatus] = useState('')
  const [loadingSource, setLoadingSource] = useState('')
  const [progress, setProgress] = useState(0)

  function startSyncWithSSE(source) {
    setLoadingSource(source)
    setStatus('')
    setProgress(0)

    const base = client.defaults?.baseURL || ''
    const url = `${base}/courses/sync/stream?source=${encodeURIComponent(source)}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.percent !== undefined) setProgress(data.percent)
        else if (data.stage) {
          const map = {
            harvester_start: 5,
            harvester_done: 30,
            spark_start: 40,
            spark_done: 80,
            all_done: 100,
            finished: 100
          }
          const p = map[data.stage]
          if (p) setProgress(p)
        }
        if (data.message) setStatus(data.message)
        if (data.stage === 'finished' || data.stage === 'all_done') {
          es.close()
          setLoadingSource('')
        }
      } catch (err) {
        console.error('SSE parse error', err)
      }
    }

    es.onerror = (err) => {
      console.error('SSE error', err)
      setStatus('Connection error or finished')
      try { es.close() } catch (e) {}
      setLoadingSource('')
    }
  }

 

  const sources = ["kaggle", "kaggle2", "illinois",]

  function onSyncAll() {
    startSyncWithSSE('all')
  }

  return (
    <div className="page">
      <style>{`
        @keyframes loadingStripe { 0% { transform: translateX(-150%); } 100% { transform: translateX(150%); } }
        .page { padding:24px; }
        .header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .card { max-width:900px; width:70%; min-width:340px; margin:28px auto; padding:20px; }
        h1 { font-size:1.9rem; margin:0 0 6px 0; }
        h2 { font-size:1.15rem; }
        .sync-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center; }
        .sync-actions { display:flex; gap:14px; flex-wrap:wrap; align-items:center; justify-content:center; }
        .sync-button { min-width:200px; padding:14px 20px; font-size:1.1rem; border-radius:8px; }
        .sync-button[disabled] { opacity: 0.6; cursor: not-allowed; }
        .progress-wrap { margin-top:18px; display:flex; align-items:center; gap:18px; justify-content:center; }
        .progress-bar { flex:1; height:20px; background:#eee; border-radius:10px; overflow:hidden; }
        .progress-fill { height:100%; background: linear-gradient(90deg,#4caf50,#66bb6a); transition: width 400ms linear; min-width:6px; }
        .status-text { min-width:280px; color:rgb(231, 227, 227); font-size:1rem; text-align:left; }
      `}</style>

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

        <div className="sync-row">
          <div className="sync-actions">
            <button
              className="button primary sync-button"
              type="button"
              onClick={onSyncAll}
              disabled={!!loadingSource}
            >
              {loadingSource === 'all' ? 'Syncing all…' : 'Sync All'}
            </button>

            {sources.map((s) => (
              <button
                key={s}
                className="button sync-button"
                type="button"
                onClick={() => startSyncWithSSE(s)}
                disabled={!!loadingSource}
              >
                {loadingSource === s ? `Syncing ${s}…` : `Sync ${s}`}
              </button>
            ))}
          </div>
        </div>

        {loadingSource && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.max(3, progress)}%` }} />
            </div>
            <div className="status-text">
              <div style={{ fontWeight: 600 }}>{status || `Syncing ${loadingSource}…`}</div>
              <div className="muted" style={{ fontSize: 12 }}>{`${progress}%`}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
