import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth'

export default function Login() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const ok = login(username, password)

    if (ok) {
      navigate('/app', { replace: true })
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="page-center">
      <div className="card narrow">
        <h1>Login</h1>
        <p className="muted">
          Open Courses Aggregator – Admin access
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            <span>Username</span>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </label>

          <label className="label">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="button primary" type="submit">
            Login
          </button>
        </form>

        <p className="hint">
          Demo credentials: <b>admin / admin</b>
        </p>
      </div>
    </div>
  )
}
