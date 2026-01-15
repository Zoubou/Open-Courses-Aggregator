import { useState, useEffect } from "react"

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
