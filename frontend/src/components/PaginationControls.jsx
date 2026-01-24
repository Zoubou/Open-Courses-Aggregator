import { useSearchParams } from "react-router-dom"

export default function PaginationControls({ total = 0, page = 1, limit = 20, loading = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.max(1, page)

  const goToPage = (newPage) => {
    // Ensure newPage is valid
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    const params = new URLSearchParams(searchParams)
    if (validPage === 1) {
      params.delete("page")
    } else {
      params.set("page", String(validPage))
    }
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Δεν κρύβουμε αν έχει μόνο μία σελίδα - εμφανίζουμε πάντα
  // Αν δεν έχουν φορτωθεί αποτελέσματα ακόμα, δεν εμφανίζουμε
  if (total === 0) {
    return null
  }

  const startIdx = (currentPage - 1) * limit + 1
  const endIdx = Math.min(currentPage * limit, total)

  return (
    <div style={{ marginTop: 32, marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div className="muted small" style={{ margin: 0 }}>
        Showing {startIdx}–{endIdx} of {total} results
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="button secondary"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
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
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={pageNum === currentPage ? "button" : "button secondary"}
                  onClick={() => goToPage(pageNum)}
                  disabled={loading}
                  style={{
                    minWidth: 36,
                    padding: "8px 12px",
                  }}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pageNum === currentPage ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className="button secondary"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
