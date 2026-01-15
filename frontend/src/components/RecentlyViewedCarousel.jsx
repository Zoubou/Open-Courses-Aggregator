import { Link } from "react-router-dom"
import { useRecentlyViewed } from "../hooks/usePersonalization"
import CoursesCarousel from "./CoursesCarousel"

export default function RecentlyViewedCarousel() {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed()

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3>Recently Viewed</h3>
        <button
          className="button secondary"
          onClick={clearRecentlyViewed}
          style={{ padding: "6px 12px", fontSize: 12 }}
        >
          Clear history
        </button>
      </div>
      <CoursesCarousel courses={recentlyViewed} title="" isLoading={false} />
    </div>
  )
}
