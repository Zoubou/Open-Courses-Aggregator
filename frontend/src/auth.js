export const AUTH_STORAGE_KEY = 'demo-auth'

export function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
}

export function login(username, password) {
  const ok = username === 'admin' && password === 'admin'
  if (ok) localStorage.setItem(AUTH_STORAGE_KEY, 'true')
  return ok
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
