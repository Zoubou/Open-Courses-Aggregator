import { useSearchParams } from "react-router-dom"

export default function ActiveFilterChips() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = {
    search: searchParams.get("search"),
    language: searchParams.get("language"),
    level: searchParams.get("level"),
    source: searchParams.get("source"),
    category: searchParams.get("category"),
  }

  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key, value]) => ({ key, value }))

  if (activeFilters.length === 0) {
    return null
  }

  const removeFilter = (key) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete(key)
    setSearchParams(newParams)
  }

  const clearAll = () => {
    setSearchParams({})
  }

  return (
    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span className="muted small" style={{ margin: 0 }}>Active filters:</span>
      {activeFilters.map(({ key, value }) => (
        <button
          key={key}
          className="filter-chip"
          onClick={() => removeFilter(key)}
          aria-label={`Remove ${key} filter: ${value}`}
        >
          {key}: <strong>{value}</strong>
          <span style={{ marginLeft: 6 }}>×</span>
        </button>
      ))}
      {activeFilters.length > 1 && (
        <button
          className="filter-chip-clear"
          onClick={clearAll}
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
