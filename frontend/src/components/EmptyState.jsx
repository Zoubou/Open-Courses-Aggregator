export default function EmptyState({ title = "No results", description = "Try adjusting your filters or search query." }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  )
}
