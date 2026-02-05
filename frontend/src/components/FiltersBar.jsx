export default function FiltersBar({
  filters,
  metadata,
  onChange,
  onClear,
}) {
  const languages = metadata?.languages ?? []
  const levels = metadata?.levels ?? []
  const sources = metadata?.sources ?? []

 const clusterNames = { 
    0: "Topic #1",
    1: "Topic #2",
    2: "Topic #3",
    3: "Topic #4",
    4: "Topic #5",
    5: "Topic #6",
    6: "Topic #7",
    7: "Topic #8",
    8: "Topic #9",
    9: "Topic #10",
    10: "Topic #11",
    11: "Topic #12",
    12: "Topic #13",
    13: "Topic #14",
    14: "Topic #15",
    15: "Topic #16",
    16: "Topic #17",
    17: "Topic #18",
    18: "Topic #19",
    19: "Topic #20"
  }

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

        <div className="field">
          <label className="field-label">Topic</label>
          <select
            className="select"
            value={filters.cluster || ""}
            onChange={(e) => setField("cluster", e.target.value)}
          >
            <option value="">All</option>
            {Object.entries(clusterNames).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
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
