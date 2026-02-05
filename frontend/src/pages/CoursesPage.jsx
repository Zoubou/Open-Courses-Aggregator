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
import { fetchCourses, fetchMetadata, fetchFeaturedCourses, fetchCourseById } from "../api/courses"
import { useRecommendations } from "../hooks/usePersonalization"

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
    language: searchParams.get("language") || "",
    level: searchParams.get("level") || "",
    source: searchParams.get("source") || "",
    cluster: searchParams.get("cluster") || ""
  })

  // Sync filters into the URL search params so navigation preserves them
  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (filters.search) params.set("search", filters.search)
    else params.delete("search")

    if (filters.language) params.set("language", filters.language)
    else params.delete("language")

    if (filters.level) params.set("level", filters.level)
    else params.delete("level")

    if (filters.source) params.set("source", filters.source)
    else params.delete("source")

    if (filters.cluster) params.set("cluster", filters.cluster)
    else params.delete("cluster")

    // Reset to first page when filters change
    params.delete("page")

    setSearchParams(params)
  }, [filters, setSearchParams])

  const debouncedSearch = useDebounced(filters.search, 500)

  const queryParams = useMemo(() => {
    // στέλνουμε στο backend μόνο ό,τι έχει τιμή
    const p = {}
    if (debouncedSearch) p.search = debouncedSearch
    if (filters.language) p.language = filters.language
    if (filters.level) p.level = filters.level
    if (filters.source) p.source = filters.source
    if (filters.cluster) p.cluster = filters.cluster
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
  }, [debouncedSearch, filters.language, filters.level, filters.source, filters.cluster, searchParams])

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [featured, setFeatured] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 })
  const { recommendations: recommended } = useRecommendations()
  const [clusterKeywords, setClusterKeywords] = useState([])

  // Set default sort to "title-asc" when component mounts
  useEffect(() => {
    if (!searchParams.get("sort")) {
      const params = new URLSearchParams(searchParams)
      params.set("sort", "title-asc")
      setSearchParams(params)
    }
  }, [searchParams, setSearchParams])

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

  // When a cluster filter is active, try to fetch cluster keywords.
  useEffect(() => {
    let cancelled = false
    async function loadClusterKeywords() {
      setClusterKeywords([])
      const cat = filters.cluster
      if (!cat) return
      // Only proceed for numeric cluster ids
      if (!/^[0-9]+$/.test(String(cat).trim())) return
      // Use the first course in the current results to get cluster info from backend
      if (!courses || courses.length === 0) return
      try {
        const c = await fetchCourseById(courses[0]._id)
        if (cancelled) return
        const kws = c?.cluster?.keywords ?? c?.cluster_keywords ?? []
        setClusterKeywords(Array.isArray(kws) ? kws.slice(0, 15) : [])
      } catch (e) {
        console.error('Failed to load cluster keywords', e)
        setClusterKeywords([])
      }
    }
    loadClusterKeywords()
    return () => { cancelled = true }
  }, [filters.cluster, courses])

  function clearFilters() {
    setFilters({ search: "", language: "", level: "", source: "", cluster: "" })
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
          <Link className="navbtn" to="/admin">Admin Sync</Link>
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

        <div className="courses-controls" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 , width: '100%'}}>
            {clusterKeywords && clusterKeywords.length > 0 && (
                <div
                  className="cluster-box"
                  style={{
                    margin: 0,
                    width: "100%",
                    minWidth: 360,
                    maxWidth: 1020,
                    minHeight: "10vh",
                    padding: "0px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div className="cluster-title" style={{ fontSize: 16, fontWeight: 600 }}>
                    Topic Keywords
                  </div>
                  <div
                    className="cluster-keywords-box description-box"
                    style={{ marginTop: 8, maxHeight: 96, overflowY: "auto" }}
                  >
                    <div className="cluster-keywords-grid">
                      {clusterKeywords.map((k, i) => (
                        <div key={i} className="chip cluster-keyword" style ={{fontSize: 14, padding: "4px 8px", color: "#ffffff"}}>{k}</div>
                      ))}
                    </div>
                  </div>
                </div>
            )}
          </div>
          <div style={{ marginLeft: "0px" }}>
            <SortDropdown />
          </div>
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
              courses={[...recommended].slice(0, 12)}
              title="Recommended based on your activity"
              isLoading={false}
            />
          </>
        )}
      </main>
    </div>
  )
}
