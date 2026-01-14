import axios from 'axios'

const API = 'http://localhost:3000'

export async function fetchCourses(params = {}) {
  const res = await axios.get(`${API}/courses`, { params })
  return res.data
}

export async function fetchMetadata() {
  const res = await axios.get(`${API}/courses/metadata`)
  return res.data
}

export async function fetchCourseById(id) {
  const res = await axios.get(`${API}/courses/${id}`)
  return res.data
}

export async function fetchSimilarCourses(id) {
  const res = await axios.get(`${API}/courses/${id}/similar`)
  return res.data
}

export async function fetchAnalytics() {
  const res = await axios.get(`${API}/courses/Analytics`)
  return res.data
}

export async function triggerSync(source) {
  const res = await axios.post(`${API}/courses/sync/${source}`)
  return res.data
}
