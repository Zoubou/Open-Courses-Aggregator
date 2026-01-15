import { useRef, useState } from "react"
import { Link } from "react-router-dom"

export default function CoursesCarousel({ courses = [], title = "Recommended", isLoading = false }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth"
      })
      setTimeout(checkScroll, 300)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      scroll("left")
    } else if (e.key === "ArrowRight") {
      scroll("right")
    }
  }

  // Skeleton loader
  if (isLoading) {
    return (
      <div style={{ marginTop: 32 }}>
        <h3>{title}</h3>
        <div className="carousel">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="carousel-item skeleton">
              <div style={{ height: 120, borderRadius: 12, marginBottom: 8 }}></div>
              <div style={{ height: 16, borderRadius: 6, marginBottom: 6 }}></div>
              <div style={{ height: 12, borderRadius: 6, width: "80%" }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!courses || courses.length === 0) {
    return (
      <div style={{ marginTop: 32 }}>
        <h3>{title}</h3>
        <p className="muted">No courses to display.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 32, position: "relative" }}>
      <h3>{title}</h3>
      
      <div className="carousel-container">
        <button
          className="carousel-btn carousel-btn-left"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        >
          ←
        </button>

        <div
          className="carousel"
          ref={scrollRef}
          onScroll={checkScroll}
          onTouchEnd={checkScroll}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label={title}
          tabIndex="0"
        >
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="carousel-item"
              aria-label={`View ${course.title}`}
            >
              <div className="carousel-item-header">
                <div
                  style={{
                    height: 120,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, rgba(125, 125, 255, 0.2), rgba(100, 108, 255, 0.1))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "rgba(125, 125, 255, 0.5)"
                  }}
                >
                  📚
                </div>
              </div>
              <h4 style={{ margin: "8px 0 6px", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {course.title.length > 40 ? course.title.substring(0, 40) + "..." : course.title}
              </h4>
              <div className="muted small" style={{ margin: 0 }}>
                {course.level || "unknown"} • {course.language || "unknown"}
              </div>
            </Link>
          ))}
        </div>

        <button
          className="carousel-btn carousel-btn-right"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        >
          →
        </button>
      </div>
    </div>
  )
}
