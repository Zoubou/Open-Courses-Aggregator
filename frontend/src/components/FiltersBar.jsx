export default function FiltersBar({
  filters,
  metadata,
  onChange,
  onClear,
}) {
  const languages = metadata?.languages ?? []
  const levels = metadata?.levels ?? []
  const sources = metadata?.sources ?? []

  function setField(field, value) {
    onChange({ ...filters, [field]: value })
  }

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "search" && v).length

  return (
    <div className="filters">
      <div className="filters-top">
        <div className="field">
          <label className="field-label">Search</label>
          <input
            className="input"
            value={filters.search || ""}
            onChange={(e) => setField("search", e.target.value)}
            placeholder="Search by title or keywords..."
          />
          <div className="muted small">Tip: search is debounced (wait ~0.5s after typing)</div>
        </div>
      </div>

      <div className="filters-grid">
        <div className="field">
          <label className="field-label">Language</label>
          <select
            className="select"
            value={filters.language || ""}
            onChange={(e) => setField("language", e.target.value)}
          >
            <option value="">All</option>
            {languages.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          {languages.length === 0 && <div className="muted small">No language values in DB yet</div>}
        </div>

        <div className="field">
          <label className="field-label">Level</label>
          <select
            className="select"
            value={filters.level || ""}
            onChange={(e) => setField("level", e.target.value)}
          >
            <option value="">All</option>
            {levels.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Source</label>
          <select
            className="select"
            value={filters.source || ""}
            onChange={(e) => setField("source", e.target.value)}
          >
            <option value="">All</option>
            {sources.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>


      </div>

      <div className="filters-bottom">
        <div className="muted small">Active filters: {activeCount}</div>
        <button className="button secondary" type="button" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  )
}
