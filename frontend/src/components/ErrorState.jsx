export default function ErrorState({ error = "An error occurred", onRetry }) {
  return (
    <div className="error" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <strong>Error:</strong> {error}
      </div>
      {onRetry && (
        <button className="button" onClick={onRetry} style={{ marginBottom: 0 }}>
          Retry
        </button>
      )}
    </div>
  )
}
