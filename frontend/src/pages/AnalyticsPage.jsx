import { useEffect, useMemo, useState } from 'react'
import { fetchAnalytics } from '../api/courses'
import { Link } from 'react-router-dom'

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await fetchAnalytics()
        setData(res)
      } catch (e) {
        setError('Failed to fetch analytics.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalCount = data?.total?.[0]?.count ?? 0

  const bySourceSorted = useMemo(() => {
    const arr = data?.bySource ?? []
    return [...arr].sort((a, b) => b.count - a.count)
  }, [data])

  const byLevelSorted = useMemo(() => {
    const arr = data?.byLevel ?? []
    return [...arr].sort((a, b) => b.count - a.count)
  }, [data])

  if (loading) {
    return (
      <div className="page">
        <p>Loading analytics…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
        <button className="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1>Analytics</h1>
          <p className="muted">Overview of courses in the database</p>
        </div>
        <Link to="/app" className="button secondary" style={{ textDecoration: 'none' }}>
          ← Back to Courses
        </Link>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Total courses</h2>
        <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6 }}>{totalCount.toLocaleString()}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>By source</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Source</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {bySourceSorted.map((x) => (
                <tr key={x._id}>
                  <td style={{ padding: '6px 0' }}>{x._id}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right' }}>{x.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>By level</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Level</th>
                <th style={{ textAlign: 'right', padding: '8px 0' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {byLevelSorted.map((x) => (
                <tr key={x._id}>
                  <td style={{ padding: '6px 0' }}>{x._id}</td>
                  <td style={{ padding: '6px 0', textAlign: 'right' }}>{x.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="muted" style={{ marginTop: 12 }}>
        Data source: <code>/courses/Analytics</code>
      </div>
    </div>
  )
}
