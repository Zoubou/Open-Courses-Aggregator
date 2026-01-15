export default function BookmarkButton({ courseId, isBookmarked, onToggle }) {
  return (
    <button
      className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
      onClick={() => onToggle(courseId)}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      title={isBookmarked ? "Bookmarked" : "Bookmark this course"}
    >
      {isBookmarked ? "★" : "☆"}
    </button>
  )
}
