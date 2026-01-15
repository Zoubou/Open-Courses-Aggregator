import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// debugging
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error?.response || error)
    return Promise.reject(error)
  }
)

export default client
