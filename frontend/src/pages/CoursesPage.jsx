import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import FiltersBar from "../components/FiltersBar"
import CourseList from "../components/CourseList"
import CourseListSkeleton from "../components/CourseListSkeleton"
import CoursesCarousel from "../components/CoursesCarousel"
import ActiveFilterChips from "../components/ActiveFilterChips"
import PaginationControls from "../components/PaginationControls"
import SortDropdown from "../components/SortDropdown"
import ErrorState from "../components/ErrorState"
import { fetchCourses, fetchMetadata, fetchFeaturedCourses } from "../api/courses"

function useDebounced(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [metadata, setMetadata] = useState(null)

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    language: "",
    level: "",
    source: "",
  })

  const debouncedSearch = useDebounced(filters.search, 500)

  const queryParams = useMemo(() => {
    // στέλνουμε στο backend μόνο ό,τι έχει τιμή
    const p = {}
    if (debouncedSearch) p.search = debouncedSearch
    if (filters.language) p.language = filters.language
    if (filters.level) p.level = filters.level
    if (filters.source) p.source = filters.source
    // Add pagination - χρησιμοποιούμε offset αντί για page
    const page = parseInt(searchParams.get("page")) || 1
    const limit = 20
    const offset = (page - 1) * limit
    p.offset = offset
    p.limit = limit
    // Add sort
    const sort = searchParams.get("sort")
    if (sort) p.sort = sort
    return p
  }, [debouncedSearch, filters.language, filters.level, filters.source, searchParams])

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [featured, setFeatured] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 })

  useEffect(() => {
    async function loadMetadata() {
      try {
        const m = await fetchMetadata()
        setMetadata(m)
      } catch (e) {
        console.error("Failed to fetch metadata", e)
      }
    }
    loadMetadata()
  }, [])

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await fetchFeaturedCourses()
        const coursesArray = Array.isArray(data) ? data : (data.courses || [])
        setFeatured(coursesArray.slice(0, 5))
      } catch (e) {
        console.error("Failed to fetch featured courses", e)
      }
    }
    loadFeatured()
  }, [])

      useEffect(() => {
    async function loadCourses() {
      setLoading(true)
      setError("")
      try {
        const data = await fetchCourses(queryParams)
        setCourses(data.courses || data)
        const currentPage = parseInt(searchParams.get("page")) || 1
        setPagination({
          total: data.total || 0,
          page: currentPage,
          limit: data.limit || 20,
          pages: data.pages || 1
        })
      } catch (e) {
        console.error("Failed to fetch courses", e)
        setError("Failed to load courses. Check backend is running.")
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [queryParams, searchParams])

  function clearFilters() {
    setFilters({ search: "", language: "", level: "", source: "" })
  }

  const handleRetry = () => {
    // Reload courses
    const p = queryParams
    if (p) {
      fetchCourses(p).then((data) => {
        setCourses(data.courses || data)
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          limit: data.limit || 20,
          pages: data.pages || 1
        })
        setError("")
      })
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1 className="title">Courses</h1>
          <div className="muted">Search & filter across sources</div>
        </div>

        <nav className="nav">
          <Link className="navbtn" to="/bookmarks">Bookmarks</Link>
          <Link className="navbtn" to="/analytics">Analytics</Link>
          <Link className="navbtn" to="/admin-sync">Admin Sync</Link>
          <Link className="navbtn" to="/success">Account</Link>
        </nav>
      </header>

      <main className="content">
        <FiltersBar
          filters={filters}
          metadata={metadata}
          onChange={setFilters}
          onClear={clearFilters}
        />

        <ActiveFilterChips />

        <div className="courses-controls">
          <SortDropdown />
        </div>

        {loading && <CourseListSkeleton count={6} />}
        {error && <ErrorState error={error} onRetry={handleRetry} />}

        {!loading && !error && (
          <>
            <CourseList courses={courses} />
            <PaginationControls
              total={pagination.total}
              page={pagination.page}
              limit={pagination.limit}
              loading={loading}
            />

            <hr style={{ margin: "32px 0", opacity: 0.2 }} />

            <CoursesCarousel
              courses={featured}
              title="Featured & Recommended"
              isLoading={false}
            />
          </>
        )}
      </main>
    </div>
  )
}
