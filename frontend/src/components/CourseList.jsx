import CourseCard from "./CourseCard"
import EmptyState from "./EmptyState"

export default function CourseList({ courses }) {
  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        title="No courses found"
        description="Try clearing filters or using a different search term."
      />
    )
  }

  return (
    <div className="courses-grid">
      {courses.map((c) => (
        <CourseCard key={c._id} course={c} />
      ))}
    </div>
  )
}
