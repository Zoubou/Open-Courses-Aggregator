import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchCourseById } from "../api/courses"
import { useBookmarks } from "../hooks/usePersonalization"
import CourseCard from "../components/CourseCard"
import EmptyState from "../components/EmptyState"

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (bookmarks.length === 0) {
        setLoading(false)
        return
      }

      try {
        const data = await Promise.all(
          bookmarks.map((id) => fetchCourseById(id).catch(() => null))
        )
        setCourses(data.filter((c) => c !== null))
      } catch (e) {
        console.error("Failed to load bookmarked courses:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookmarks])

  if (loading) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div>
            <h1 className="title">My Bookmarks</h1>
            <div className="muted">Saved courses for later</div>
          </div>
          <Link to="/app" className="navbtn">
            ← Back to courses
          </Link>
        </header>
        <main className="content">
          <div className="muted">Loading…</div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1 className="title">My Bookmarks</h1>
          <div className="muted">{courses.length} saved course{courses.length !== 1 ? "s" : ""}</div>
        </div>
        <Link to="/app" className="navbtn">
          ← Back to courses
        </Link>
      </header>

      <main className="content">
        {courses.length === 0 ? (
          <EmptyState
            title="No bookmarks yet"
            description="Click the star icon on a course to save it for later."
          />
        ) : (
          <div className="courses-grid">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
