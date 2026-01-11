import { useNavigate } from 'react-router-dom'
import { logout } from '../auth'

export default function Success() {
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="page">
      <div className="card">
        <h1>okay login</h1>
        <p className="muted">You successfully logged in.</p>
        <button className="button secondary" onClick={onLogout} type="button">
          Log out
        </button>
      </div>
    </div>
  )
}
