import { useSearchParams } from "react-router-dom"

export default function PaginationControls({ total = 0, page = 1, limit = 20, loading = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const totalPages = Math.ceil(total / limit) || 1

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams)
    if (newPage === 1) {
      params.delete("page")
    } else {
      params.set("page", newPage)
    }
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (totalPages <= 1) {
    return null
  }

  const startIdx = (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, total)

  return (
    <div style={{ marginTop: 32, marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div className="muted small" style={{ margin: 0 }}>
        Showing {startIdx}–{endIdx} of {total} results
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className="button secondary"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1 || loading}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Show page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={pageNum === page ? "button" : "button secondary"}
                onClick={() => goToPage(pageNum)}
                disabled={loading}
                style={{
                  minWidth: 36,
                  padding: "8px 12px",
                }}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === page ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          className="button secondary"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages || loading}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
