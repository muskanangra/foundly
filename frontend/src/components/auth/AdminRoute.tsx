/* Redirects non-admin users; requires both login and admin role */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../ui/Loader'

export function AdminRoute() {
  const { isLoggedIn, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size={32} />
      </div>
    )
  }

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <ShieldOff size={24} aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-text">No access</p>
        <p className="text-sm text-muted">This page is for administrators only.</p>
      </div>
    )
  }

  return <Outlet />
}
