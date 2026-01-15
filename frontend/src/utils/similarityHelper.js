/**
 * Client-side similarity scorer (fallback when Spark data is unavailable)
 * Infers similarity based on shared keywords, language, and level
 */
export function scoreCourseSimilarity(course1, course2) {
  let score = 0;

  // Shared keywords (heaviest weight)
  if (course1.keywords && course2.keywords) {
    const shared = course1.keywords.filter((k) =>
      course2.keywords.some((k2) => k.toLowerCase() === k2.toLowerCase())
    ).length;
    score += shared * 10;
  }

  // Same language
  if (course1.language && course2.language && course1.language === course2.language) {
    score += 5;
  }

  // Same level
  if (course1.level && course2.level && course1.level === course2.level) {
    score += 3;
  }

  // Same source
  if (course1.source?.name && course2.source?.name && course1.source.name === course2.source.name) {
    score += 2;
  }

  return score;
}

/**
 * Find client-side similar courses (fallback)
 */
export function findClientSimilarCourses(targetCourse, allCourses = [], limit = 3) {
  if (!targetCourse || !Array.isArray(allCourses)) {
    return [];
  }

  return allCourses
    .filter((c) => c._id !== targetCourse._id)
    .map((c) => ({
      course: c,
      score: scoreCourseSimilarity(targetCourse, c),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.course);
}

/**
 * Get recommendation reason badge
 */
export function getRecommendationReason(course1, course2) {
  const reasons = [];

  if (course1.keywords && course2.keywords) {
    const shared = course1.keywords.filter((k) =>
      course2.keywords.some((k2) => k.toLowerCase() === k2.toLowerCase())
    );
    if (shared.length > 0) {
      reasons.push(`${shared.length} shared keyword${shared.length > 1 ? "s" : ""}`);
    }
  }

  if (course1.level && course2.level && course1.level === course2.level) {
    reasons.push(`Same level (${course1.level})`);
  }

  return reasons.length > 0 ? reasons.join(" • ") : "Related course";
}
