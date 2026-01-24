import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { fetchCourseById, fetchSimilarCourses, fetchCourses } from "../api/courses"
import RecommendationBadge from "../components/RecommendationBadge"
import BookmarkButton from "../components/BookmarkButton"
import { findClientSimilarCourses, getRecommendationReason } from "../utils/similarityHelper"
import { useBookmarks, useRecentlyViewed } from "../hooks/usePersonalization"

export default function CourseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { addViewedCourse } = useRecentlyViewed()

  function handleKeywordClick(keyword) {
    navigate(`/app?search=${encodeURIComponent(keyword)}`)
  }

  const [course, setCourse] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      setUsingFallback(false)
      try {
        const c = await fetchCourseById(id)
        let s = await fetchSimilarCourses(id)
        
        // If Spark returns empty, use client-side fallback
        if (!s || s.length === 0) {
          try {
            const allCoursesData = await fetchCourses({ limit: 100 })
            const allCourses = allCoursesData.courses || allCoursesData
            s = findClientSimilarCourses(c, allCourses, 3)
            setUsingFallback(true)
          } catch (e) {
            console.warn("Could not load fallback similar courses:", e)
            s = []
          }
        }
        
        setCourse(c)
        setSimilar(s)
        addViewedCourse(c)
      } catch (e) {
        console.error("Failed to load course details", e)
        setError("Failed to load course details.")
        setCourse(null)
        setSimilar([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="content muted">Loading course…</div>
  if (error) return <div className="content error">{error}</div>
  if (!course) return <div className="content muted">Course not found.</div>

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Link to="/app" className="back-btn">
          <span style={{ fontSize: 18, marginRight: 6 }}>←</span> Back to Courses
        </Link>
        <BookmarkButton
          courseId={id}
          isBookmarked={isBookmarked(id)}
          onToggle={toggleBookmark}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>{course.title}</h1>
          <div className="muted">
            {course.language || "unknown"} • {course.level || "unknown"} • {course.source?.name || "unknown"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 14 }}>Description</h3>
        <div className="description-box">
          <p className="description-text">
            {course.description || "No description available."}
          </p>
        </div>
      </div>

      {course.link && (
        <p style={{ marginTop: 12 }}>
          <a href={course.link} target="_blank" rel="noreferrer">
            Go to original course →
          </a>
        </p>
      )}

      {Array.isArray(course.keywords) && course.keywords.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Keywords</h3>
          <div className="chips">
            {course.keywords.slice(0, 15).map((k) => (
              <button
                key={k}
                type="button"
                className="chip"
                onClick={() => handleKeywordClick(k)}
            >
          {k}
      </button>
))}

          </div>
        </div>
      )}

      <hr style={{ margin: "22px 0", opacity: 0.2 }} />

      <h3>Similar Courses</h3>
      {similar.length === 0 ? (
        <p className="muted">No similar courses available.</p>
      ) : (
        <ul className="similar-list">
          {similar.map((c) => (
            <li key={c._id} className="similar-item">
              <div>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div className="muted small" style={{ marginBottom: 4 }}>
                  {c.language || "unknown"} • {c.level || "unknown"}
                </div>
                {usingFallback && (
                  <RecommendationBadge
                    reason={getRecommendationReason(course, c)}
                    isSparkData={false}
                  />
                )}
              </div>
              <Link className="navbtn" to={`/courses/${c._id}`}>View</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
