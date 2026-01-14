import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchCourseById, fetchSimilarCourses } from '../api/courses'

export default function CourseDetailsPage() {
  const { id } = useParams()

  const [course, setCourse] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const c = await fetchCourseById(id)
      const s = await fetchSimilarCourses(id)
      setCourse(c)
      setSimilar(s)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p>Loading course...</p>
  if (!course) return <p>Course not found.</p>

  return (
    <div className="page">
      <Link to="/app">← Back to courses</Link>

      <h1>{course.title}</h1>

      <p className="muted">
        {course.language} | {course.level} | {course.source?.name}
      </p>

      {course.description && (
        <>
          <h3>Description</h3>
          <p>{course.description}</p>
        </>
      )}

      {course.link && (
        <p>
          <a href={course.link} target="_blank" rel="noreferrer">
            Go to original course →
          </a>
        </p>
      )}

      <hr />

      <h3>Similar Courses</h3>

      {similar.length === 0 ? (
        <p className="muted">
          No similar courses available (Spark results not ready yet).
        </p>
      ) : (
        <ul className="course-list">
          {similar.map((c) => (
            <li key={c._id} className="course-card">
              <h4>{c.title}</h4>
              <p>{c.language} | {c.level}</p>
              <Link to={`/courses/${c._id}`}>View</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
