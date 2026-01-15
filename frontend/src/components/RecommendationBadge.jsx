export default function RecommendationBadge({ reason, isSparkData = false }) {
  if (!reason) return null;

  return (
    <span
      className="recommendation-badge"
      title={isSparkData ? "Powered by Spark ML" : "Client-side similarity"}
    >
      {reason}
      {isSparkData && " ⭐"}
    </span>
  );
}
