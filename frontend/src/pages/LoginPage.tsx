import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api/auth'
import { ApiError } from '../api/client'
import type { AuthResponse } from '../api/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/feed'
  const { login, isLoggedIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({})
  const [loading, setLoading] = useState(false)

  if (isLoggedIn) return <Navigate to={redirect} replace />

  const validate = () => {
    const errs: typeof errors = {}
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const response: AuthResponse = await apiLogin(email, password)
      login(response)
      navigate(redirect, { replace: true })
    } catch (err) {
      setErrors({ server: err instanceof ApiError ? err.detail : 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-taupe/40 bg-champagne p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo size="md" />
          <div className="text-center">
            <h1 className="font-display text-[32px] font-semibold text-navy leading-tight">
              Welcome back
            </h1>
            <p className="mt-1 font-sans text-sm text-sapphire/70">
              Sign in to your account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder="you@juit.ac.in"
            aria-required="true"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            placeholder="Your password"
            aria-required="true"
          />

          {errors.server && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 font-sans text-sm text-danger">
              {errors.server}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading} className="mt-2 w-full">
            {loading ? 'Signing in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center font-sans text-sm text-sapphire/70">
          No account?{' '}
          <Link to="/register" className="text-sapphire font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
