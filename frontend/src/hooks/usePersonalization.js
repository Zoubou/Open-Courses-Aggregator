import { useState, useEffect } from "react"
import { fetchSimilarCourses } from "../api/courses"

const BOOKMARKS_KEY = "courses_bookmarks"
const RECENTLY_VIEWED_KEY = "courses_recently_viewed"

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(BOOKMARKS_KEY)
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse bookmarks:", e)
      }
    }
  }, [])

  const toggleBookmark = (courseId) => {
    setBookmarks((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const isBookmarked = (courseId) => bookmarks.includes(courseId)

  return { bookmarks, toggleBookmark, isBookmarked }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse recently viewed:", e)
      }
    }
  }, [])

  const addViewedCourse = (course) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists (to move to front)
      const updated = prev.filter((c) => c._id !== course._id)
      // Add to front, keep only last 10
      const newList = [course, ...updated].slice(0, 10)
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newList))
      return newList
    })
  }

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    localStorage.removeItem(RECENTLY_VIEWED_KEY)
  }

  return { recentlyViewed, addViewedCourse, clearRecentlyViewed }
}

export function useRecommendations(options = {}) {
  const { source = "both", perSource = 5, totalLimit = 20, bookmarkBoost = 1.2 } = options
  const { bookmarks } = useBookmarks()
  const { recentlyViewed } = useRecentlyViewed()

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // collect ids to query
        const ids = []
        if ((source === "both" || source === "bookmarks") && bookmarks.length) {
          ids.push(...bookmarks.slice(-perSource))
        }
        if ((source === "both" || source === "recent") && recentlyViewed.length) {
          ids.push(...recentlyViewed.map((c) => c._id).slice(0, perSource))
        }

        const uniqueIds = Array.from(new Set(ids))
        if (uniqueIds.length === 0) {
          if (mounted) setRecommendations([])
          return
        }

        // fetch in small batches to avoid flooding the API
        const batchSize = 5
        const allResults = []
        // prepare a fast lookup for bookmark ids
        const bookmarkSet = new Set(bookmarks.slice(-perSource))
        for (let i = 0; i < uniqueIds.length; i += batchSize) {
          const batch = uniqueIds.slice(i, i + batchSize)
          const res = await Promise.all(
            batch.map(async (id) => {
              try {
                const r = await fetchSimilarCourses(id)
                if (!r) return []
                const arr = Array.isArray(r) ? r : [r]
                return arr.map((item) => ({ ...item, _sourceId: id, _isBookmark: bookmarkSet.has(id) }))
              } catch (e) {
                return []
              }
            })
          )
          allResults.push(...res.flat())
        }

        // flattened results are in allResults
        const flattened = allResults

        // dedupe by _id, keep highest score if provided, exclude source ids
        const exclude = new Set(uniqueIds)
        const map = new Map()
        for (const item of flattened) {
          if (!item || !item._id) continue
          if (exclude.has(item._id)) continue
          const baseScore = item.score || 0
          const boostedScore = baseScore * (item._isBookmark ? bookmarkBoost : 1)
          const existing = map.get(item._id)
          const existingScore = existing ? existing.score : -Infinity
          if (!existing || boostedScore > existingScore) {
            map.set(item._id, { ...item, originalScore: baseScore, score: boostedScore })
          }
        }

        const sorted = Array.from(map.values()).sort((a, b) => (b.score || 0) - (a.score || 0))
        const finalList = sorted.slice(0, totalLimit)

        if (mounted) setRecommendations(finalList)
      } catch (e) {
        if (mounted) setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [bookmarks, recentlyViewed, source, perSource, totalLimit, version])

  return {
    recommendations,
    loading,
    error,
    refresh: () => setVersion((v) => v + 1),
  }
}
