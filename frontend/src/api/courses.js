import client from './client'

export async function fetchCourses(params = {}) {
  const res = await client.get('/courses', { params })
  // Handle both old array format and new object format with pagination
  return Array.isArray(res.data) ? { courses: res.data, total: res.data.length, page: 1, limit: res.data.length, pages: 1 } : res.data
}

export async function fetchMetadata() {
  const res = await client.get('/courses/metadata')
  return res.data
}

export async function fetchCourseById(id) {
  const res = await client.get(`/courses/${id}`)
  return res.data
}

export async function fetchSimilarCourses(id) {
  const res = await client.get(`/courses/${id}/similar`)
  return res.data
}

export async function fetchFeaturedCourses() {
  const res = await client.get('/courses?limit=5')
  return res.data
}

export async function fetchAnalytics() {
  const res = await client.get('/courses/Analytics')
  return res.data
}

export async function triggerSync(source) {
  const res = await client.post(`/courses/sync/${source}`)
  return res.data
}
