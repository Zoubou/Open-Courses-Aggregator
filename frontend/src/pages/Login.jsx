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
      <div className="card narrow login-card">
        <div className="login-header">
          <div className="logo-icon">📚</div>
          <h1 className="login-title">Open Courses</h1>
          <h2 className="login-subtitle">Aggregator</h2>
        </div>

        <p className="login-description">
          Premium platform for discovering, learning, and organizing courses
        </p>

        <form className="form login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">
              <span className="label-text">Username</span>
              <input
                className="input login-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label className="label">
              <span className="label-text">Password</span>
              <input
                className="input login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠</span> {error}
            </div>
          )}

          <button className="button login-button" type="submit">
            <span>Sign In</span>
            <span className="arrow">→</span>
          </button>
        </form>

        <div className="login-footer">
          <p className="hint-text">
            Demo: <code>admin</code> / <code>admin</code>
          </p>
        </div>
      </div>
    </div>
  )
}
