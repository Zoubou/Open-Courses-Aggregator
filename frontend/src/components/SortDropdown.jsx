import { useSearchParams } from "react-router-dom"

export default function SortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentSort = searchParams.get("sort") || "title-asc"

  const handleSort = (sortValue) => {
    const params = new URLSearchParams(searchParams)
    if (sortValue === "title-asc") {
      params.delete("sort")
    } else {
      params.set("sort", sortValue)
    }
    params.delete("page") // Reset to page 1 when sorting changes
    setSearchParams(params)
  }

  return (
    <div className="sort-section">
      <label className="sort-label" htmlFor="sort-select">Sort by</label>
      <select
        id="sort-select"
        className="sort-select"
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        aria-label="Sort courses by"
      >
        <option value="title-asc">Title A–Z.</option>
        <option value="title-desc">Title Z–A.</option>
      </select>
    </div>
  )
}
