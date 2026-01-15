import { Link } from "react-router-dom"

export default function CourseCard({ course }) {
  const title = course?.title || "Untitled"
  const level = course?.level || "unknown"
  const language = course?.language || "unknown"
  const source = course?.source?.name || "unknown"
  const description = course?.description || "No description."

  return (
    <div className="course-card">
      <h3 className="course-title">{title}</h3>

      <div className="course-meta muted small">
        — {language} • {level} • {source}
      </div>

      <p className="course-desc muted">{description}</p>

      <div className="course-actions">
        <Link className="button primary" to={`/courses/${course._id}`}>
          View details
        </Link>
      </div>
    </div>
  )
}
