import { Link, useLocation } from "react-router-dom"

export default function CourseCard({ course }) {
  const location = useLocation()
  const title = course?.title || "Untitled"
  const level = course?.level || "unknown"
  const language = course?.language || "unknown"
  const source = course?.source?.name || "unknown"
  const description = course?.description || "No description available."

  // Truncate description to 120 characters
  const truncatedDesc = description.length > 120 ? description.substring(0, 120) + "..." : description

  return (
    <div className="course-card">
      <h3 className="course-title" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.3 }}>{title}</h3>

      <div className="course-meta muted small" style={{ marginBottom: "12px" }}>
        — {language} • {level} • {source}
      </div>

      <p className="course-desc muted" style={{ fontSize: "14px", marginBottom: "12px", lineHeight: 1.5 }}>{truncatedDesc}</p>

      <div className="course-actions">
        <Link className="button primary" to={`/courses/${course._id}${location.search}`}>
          View details
        </Link>
      </div>
    </div>
  )
}
