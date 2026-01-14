import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCourses, fetchMetadata } from '../api/courses'

function useDebouncedValue(value, delay = 450) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}

export default function CoursesPage() {
  const [metadata, setMetadata] = useState(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const [language, setLanguage] = useState('')
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 1) Load metadata once
  useEffect(() => {
    async function loadMeta() {
      try {
        const m = await fetchMetadata()
        setMetadata(m)
      } catch (e) {
        // metadata is nice-to-have; app can still run without it
        console.error(e)
      }
    }
    loadMeta()
  }, [])

  // 2) Load courses when filters change
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        setError('')

        const params = {
          search: debouncedSearch || undefined,
          language: language || undefined,
          level: level || undefined,
          source: source || undefined,
          category: category || undefined,
        }

        const data = await fetchCourses(params)
        setCourses(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        setError('Failed to load courses. Check backend is running.')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [debouncedSearch, language, level, source, category])

  const activeFiltersCount = useMemo(() => {
    return [debouncedSearch, language, level, source, category].filter(Boolean).length
  }, [debouncedSearch, language, level, source, category])

  function clearFilters() {
    setSearch('')
    setLanguage('')
    setLevel('')
    setSource('')
    setCategory('')
  }

  return (
    <div className="page">
      {/* Header / Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Courses</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Search & filter across sources
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/analytics" className="button secondary" style={{ textDecoration: 'none' }}>
            Analytics
          </Link>
          <Link to="/admin" className="button secondary" style={{ textDecoration: 'none' }}>
            Admin Sync
          </Link>
          <Link to="/success" className="button secondary" style={{ textDecoration: 'none' }}>
            Account
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <label className="label">
              <span>Search</span>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or keywords…"
              />
            </label>
            <p className="muted" style={{ marginTop: 6 }}>
              Tip: search is debounced (wait ~0.5s after typing)
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <label className="label">
              <span>Language</span>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">All</option>
                {(metadata?.languages ?? []).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Level</span>
              <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">All</option>
                {(metadata?.levels ?? []).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Source</span>
              <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">All</option>
                {(metadata?.sources ?? []).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Category</span>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                {(metadata?.categories ?? []).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div className="muted">
              Active filters: <b>{activeFiltersCount}</b>
            </div>

            <button className="button secondary" type="button" onClick={clearFilters} disabled={activeFiltersCount === 0}>
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginTop: 12 }}>
        {error && <p className="error">{error}</p>}

        {loading ? (
          <p>Loading courses…</p>
        ) : courses.length === 0 ? (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>No results</h3>
            <p className="muted">Try clearing filters or using a different search.</p>
          </div>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 8 }}>
              Showing <b>{courses.length}</b> courses (backend returns up to 50)
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {courses.map((c) => (
                <div key={c._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 6, lineHeight: 1.15 }}>{c.title}</h3>
                  </div>

                  <p className="muted" style={{ marginTop: 0 }}>
                    {c.language || '—'} • {c.level || '—'} • {c.source?.name || '—'}
                  </p>

                  {c.description ? (
                    <p style={{ marginTop: 10 }}>
                      {c.description.length > 140 ? c.description.slice(0, 140) + '…' : c.description}
                    </p>
                  ) : (
                    <p className="muted" style={{ marginTop: 10 }}>
                      No description.
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 12 }}>
                    <Link to={`/courses/${c._id}`} className="button primary" style={{ textDecoration: 'none' }}>
                      View details
                    </Link>

                    {c.link ? (
                      <a href={c.link} target="_blank" rel="noreferrer" className="muted">
                        Source →
                      </a>
                    ) : (
                      <span className="muted"> </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
