/**
 * Compute basic analytics from course data
 * Used as fallback when analytics endpoint is unavailable
 */
export function computeAnalytics(courses = []) {
  if (!Array.isArray(courses)) {
    return null;
  }

  let totalCount = courses.length;

  // Count by source
  const bySourceMap = {};
  courses.forEach((c) => {
    const source = c.source?.name || "unknown";
    bySourceMap[source] = (bySourceMap[source] || 0) + 1;
  });
  const bySource = Object.entries(bySourceMap).map(([name, count]) => ({
    _id: name,
    count,
  }));

  // Count by level
  const byLevelMap = {};
  courses.forEach((c) => {
    const level = c.level || "unknown";
    byLevelMap[level] = (byLevelMap[level] || 0) + 1;
  });
  const byLevel = Object.entries(byLevelMap).map(([name, count]) => ({
    _id: name,
    count,
  }));

  // Count by language
  const byLanguageMap = {};
  courses.forEach((c) => {
    const language = c.language || "unknown";
    byLanguageMap[language] = (byLanguageMap[language] || 0) + 1;
  });
  const byLanguage = Object.entries(byLanguageMap).map(([name, count]) => ({
    _id: name,
    count,
  }));

  return {
    total: [{ count: totalCount }],
    bySource,
    byLevel,
    byLanguage,
    _clientComputed: true,
  };
}
