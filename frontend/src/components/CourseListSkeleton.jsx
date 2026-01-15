import CourseCardSkeleton from "./CourseCardSkeleton"

export default function CourseListSkeleton({ count = 6 }) {
  return (
    <div className="courses-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}
