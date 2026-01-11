import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, login } from '../auth'

export default function Login() {
  const navigate = useNavigate()
  const [alreadyAuthed, setAlreadyAuthed] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const authed = isAuthenticated()
    setAlreadyAuthed(authed)
    if (authed) navigate('/success', { replace: true })
  }, [navigate])

  if (alreadyAuthed) return null

  function onSubmit(e) {
    e.preventDefault()
    setError('')

    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Invalid credentials. Try admin / admin.')
      return
    }

    navigate('/success', { replace: true })
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Login</h1>
        <p className="muted">Use username: <b>admin</b> and password: <b>admin</b>.</p>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Username
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="admin"
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="button" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  )
}
