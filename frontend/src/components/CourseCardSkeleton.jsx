export default function CourseCardSkeleton() {
  return (
    <div className="course-card skeleton">
      <div style={{ height: 18, borderRadius: 6, marginBottom: 8 }}></div>
      <div style={{ height: 12, borderRadius: 6, marginBottom: 6, width: "70%" }}></div>
      <div style={{ height: 13, borderRadius: 6, marginBottom: 10, width: "80%" }}></div>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ height: 10, borderRadius: 6, width: "100%" }}></div>
        <div style={{ height: 10, borderRadius: 6, width: "95%" }}></div>
        <div style={{ height: 10, borderRadius: 6, width: "90%" }}></div>
      </div>
      <div style={{ height: 36, borderRadius: 6, marginTop: 12 }}></div>
    </div>
  )
}
