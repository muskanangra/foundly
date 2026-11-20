import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister } from '../api/auth'
import { ApiError } from '../api/client'
import type { AuthResponse } from '../api/types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/feed'
  const { login, isLoggedIn } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirm?: string; server?: string
  }>({})
  const [loading, setLoading] = useState(false)

  if (isLoggedIn) return <Navigate to={redirect} replace />

  const validate = () => {
    const errs: typeof errors = {}
    if (!name.trim()) {
      errs.name = 'Name is required'
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters'
    }
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address'
    }
    if (!password) {
      errs.password = 'Password is required'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }
    if (!confirm) {
      errs.confirm = 'Please confirm your password'
    } else if (confirm !== password) {
      errs.confirm = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const response: AuthResponse = await apiRegister(name.trim(), email, password)
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
              Create account
            </h1>
            <p className="mt-1 font-sans text-sm text-sapphire/70">
              Join the JUIT community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            placeholder="Your name"
            aria-required="true"
          />
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
            helper="Minimum 8 characters"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            aria-required="true"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-required="true"
          />

          {errors.server && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 font-sans text-sm text-danger">
              {errors.server}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading} className="mt-2 w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center font-sans text-sm text-sapphire/70">
          Have an account?{' '}
          <Link to="/login" className="text-sapphire font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
