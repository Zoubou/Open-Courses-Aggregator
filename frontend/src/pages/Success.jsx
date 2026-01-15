import { useNavigate } from 'react-router-dom'
import { logout } from '../auth'

export default function Success() {
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function goToCourses() {
    navigate('/app', { replace: true })
  }

  return (
    <div className="page-center">
      <div className="card narrow">
        <h1>Account</h1>
        <p className="muted">You are logged in as admin.</p>

        <div style={{ display: 'grid', gap: 10 }}>
          <button className="button primary" onClick={goToCourses} type="button">
            Go to Courses
          </button>

          <button className="button secondary" onClick={onLogout} type="button">
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
