import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, X, ChevronDown, LogOut, User, AlertCircle, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { getUnreadCount } from '../../api/notifications'
import { Logo } from './Logo'

const navLinks = [
  { label: 'Browse',   to: '/feed'     },
  { label: 'Post',     to: '/post'     },
  { label: 'My Posts', to: '/my-posts' },
  { label: 'Chats',    to: '/chats'    },
]

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'relative font-mono text-[0.6rem] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors',
          isActive
            ? 'text-accent'
            : 'text-ink-soft hover:text-ink hover:bg-surface-2',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="mr-1 text-accent" aria-hidden="true">•</span>}
          {label}
        </>
      )}
    </NavLink>
  )
}

export function Navbar() {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return }
    getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {})
    const interval = setInterval(() => {
      getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {})
    }, 60_000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  useEffect(() => {
    if (location.pathname === '/notifications') setUnreadCount(0)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* Desktop floating pill */}
      <nav
        aria-label="Main navigation"
        className={clsx(
          'fixed bottom-6 left-1/2 z-40 -translate-x-1/2',
          'hidden sm:flex items-center gap-1',
          'rounded-full border border-line bg-surface',
          'px-3 py-2 shadow-lg',
        )}
      >
        <Link to="/" aria-label="Foundly home" className="mr-2 flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-0.5">
          {navLinks.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}
        </div>

        <div className="mx-2 h-4 w-px bg-line" aria-hidden="true" />

        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            {/* Notifications bell */}
            <NavLink
              to="/notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              className={({ isActive }) =>
                clsx(
                  'relative rounded-full p-2 transition-colors',
                  isActive
                    ? 'text-accent bg-accent-tint'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                )
              }
            >
              <Bell size={15} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-accent px-0.5 font-mono text-[0.5rem] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <User size={12} aria-hidden="true" />
                {user?.name ?? 'Account'}
                <ChevronDown size={10} aria-hidden="true" />
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    aria-hidden="true"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute bottom-full right-0 z-40 mb-2 w-44 rounded-[10px] border border-line bg-surface shadow-xl">
                    <ul role="menu" className="p-1">
                      <li>
                        <Link
                          to="/alerts"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[5px] px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
                        >
                          <AlertCircle size={12} aria-hidden="true" /> My Alerts
                        </Link>
                      </li>
                      {user?.role === 'admin' && (
                        <li>
                          <Link
                            to="/admin"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-[5px] px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
                          >
                            <ShieldCheck size={12} aria-hidden="true" /> Admin
                          </Link>
                        </li>
                      )}
                      <li>
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-danger hover:bg-danger/10 transition-colors"
                        >
                          <LogOut size={12} aria-hidden="true" /> Log out
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="rounded-full px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-full bg-accent px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-white hover:bg-accent-ink transition-colors"
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>

      {/* Mobile floating pill */}
      <nav
        aria-label="Mobile navigation"
        className={clsx(
          'fixed bottom-4 left-4 right-4 z-40 sm:hidden',
          'flex items-center justify-between',
          'rounded-full border border-line bg-surface',
          'px-4 py-3 shadow-lg',
        )}
      >
        <Link to="/" aria-label="Foundly home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              clsx(
                'font-mono text-[0.6rem] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors',
                isActive ? 'text-accent' : 'text-ink-soft hover:text-ink',
              )
            }
          >
            Browse
          </NavLink>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="rounded-full p-2 text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
          >
            {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm sm:hidden"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-40 rounded-[10px] border border-line bg-surface p-4 shadow-2xl sm:hidden">
            <ul className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'block rounded-[5px] px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest transition-colors',
                        isActive
                          ? 'text-accent bg-accent-tint'
                          : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              {isLoggedIn ? (
                <>
                  <li>
                    <NavLink
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2 rounded-[5px] px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest transition-colors',
                          isActive
                            ? 'text-accent bg-accent-tint'
                            : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                        )
                      }
                    >
                      <Bell size={12} aria-hidden="true" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[0.5rem] font-black text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/alerts"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2 rounded-[5px] px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest transition-colors',
                          isActive
                            ? 'text-accent bg-accent-tint'
                            : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                        )
                      }
                    >
                      <AlertCircle size={12} aria-hidden="true" /> My Alerts
                    </NavLink>
                  </li>
                  {user?.role === 'admin' && (
                    <li>
                      <NavLink
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-2 rounded-[5px] px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest transition-colors',
                            isActive
                              ? 'text-accent bg-accent-tint'
                              : 'text-ink-soft hover:text-ink hover:bg-surface-2',
                          )
                        }
                      >
                        <ShieldCheck size={12} aria-hidden="true" /> Admin
                      </NavLink>
                    </li>
                  )}
                  <li className="pt-1 border-t border-line">
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-[5px] px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut size={12} aria-hidden="true" /> Log out
                    </button>
                  </li>
                </>
              ) : (
                <li className="flex gap-2 pt-2 border-t border-line">
                  <button
                    className="flex-1 rounded-[5px] border border-line px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
                    onClick={() => { navigate('/login'); setMenuOpen(false) }}
                  >
                    Log in
                  </button>
                  <button
                    className="flex-1 rounded-[5px] bg-accent px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-white hover:bg-accent-ink transition-colors"
                    onClick={() => { navigate('/register'); setMenuOpen(false) }}
                  >
                    Sign Up
                  </button>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
