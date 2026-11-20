import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, X, ChevronDown, LogOut, AlertCircle, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useRealtime } from '../../context/RealtimeProvider'
import { Logo } from './Logo'

const navLinks = [
  { label: 'Browse',       to: '/feed'      },
  { label: 'Post a find',  to: '/post'      },
  { label: 'My posts',     to: '/my-posts'  },
  { label: 'Chats',        to: '/chats'     },
]


export function Navbar() {
  const { isLoggedIn, user, logout } = useAuth()
  const { unreadCount } = useRealtime()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* Close mobile menu on navigation */
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const isLandingPage = location.pathname === '/'

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 h-16',
          'flex items-center',
          'transition-all duration-200',
          isLandingPage && !scrolled
            ? 'bg-navy border-b border-transparent'
            : 'bg-ivory border-b border-taupe/50 shadow-sm',
        )}
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6">
          {/* Wordmark */}
          <Link to="/" aria-label="Foundly home">
            <Logo onDark={isLandingPage && !scrolled} />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <span
                key={l.to}
                className={clsx(
                  isLandingPage && !scrolled && '[&_a]:text-ivory/80 [&_a:hover]:text-ivory [&_a.active]:text-ivory',
                )}
              >
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    clsx(
                      'relative font-sans text-[15px] font-medium px-1 py-1 transition-colors',
                      isLandingPage && !scrolled
                        ? isActive
                          ? 'text-ivory after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:bg-ivory'
                          : 'text-ivory/80 hover:text-ivory'
                        : isActive
                          ? 'text-sapphire after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[1.5px] after:rounded-full after:bg-sapphire'
                          : 'text-navy hover:text-sapphire',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </span>
            ))}
          </nav>

          {/* Right side: bell + user */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Bell */}
                <NavLink
                  to="/notifications"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  className={({ isActive }) =>
                    clsx(
                      'relative rounded-full p-2 transition-colors',
                      isLandingPage && !scrolled
                        ? 'text-ivory/80 hover:text-ivory hover:bg-white/10'
                        : isActive
                          ? 'text-sapphire bg-champagne'
                          : 'text-sapphire hover:bg-champagne',
                    )
                  }
                >
                  <Bell size={18} aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-0.5 font-sans text-[11px] font-bold text-ivory">
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
                    className={clsx(
                      'flex items-center gap-2 rounded-full px-4 py-2 font-sans text-[15px] font-medium transition-colors',
                      isLandingPage && !scrolled
                        ? 'text-ivory/80 hover:text-ivory hover:bg-white/10'
                        : 'text-navy hover:bg-champagne',
                    )}
                  >
                    {user?.name ?? 'Account'}
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        aria-hidden="true"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 z-40 mt-2 w-48 rounded-2xl border border-taupe bg-ivory shadow-xl overflow-hidden">
                        <ul role="menu" className="p-1.5">
                          <li>
                            <Link
                              to="/alerts"
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-sm text-navy hover:bg-champagne transition-colors"
                            >
                              <AlertCircle size={15} aria-hidden="true" /> My alerts
                            </Link>
                          </li>
                          {user?.role === 'admin' && (
                            <li>
                              <Link
                                to="/admin"
                                role="menuitem"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-sm text-navy hover:bg-champagne transition-colors"
                              >
                                <ShieldCheck size={15} aria-hidden="true" /> Admin
                              </Link>
                            </li>
                          )}
                          <li className="pt-1 border-t border-taupe/40 mt-1">
                            <button
                              role="menuitem"
                              onClick={handleLogout}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-sans text-sm text-danger hover:bg-danger/10 transition-colors"
                            >
                              <LogOut size={15} aria-hidden="true" /> Log out
                            </button>
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className={clsx(
                    'rounded-full px-4 py-2 font-sans text-[15px] font-medium transition-colors',
                    isLandingPage && !scrolled
                      ? 'text-ivory/80 hover:text-ivory hover:bg-white/10'
                      : 'text-navy hover:bg-champagne',
                  )}
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className={clsx(
                    'rounded-full border-[1.5px] px-4 py-2 font-sans text-[15px] font-medium transition-colors',
                    isLandingPage && !scrolled
                      ? 'border-ivory/60 text-ivory hover:bg-white/10'
                      : 'border-navy text-navy hover:bg-champagne',
                  )}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && (
              <NavLink
                to="/notifications"
                className="relative rounded-full p-2 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell
                  size={18}
                  className={isLandingPage && !scrolled ? 'text-ivory/80' : 'text-sapphire'}
                  aria-hidden="true"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-0.5 font-sans text-[10px] font-bold text-ivory">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={clsx(
                'rounded-full p-2 transition-colors',
                isLandingPage && !scrolled
                  ? 'text-ivory/80 hover:text-ivory'
                  : 'text-navy hover:bg-champagne',
              )}
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-navy/40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-ivory flex flex-col md:hidden overflow-y-auto">
            <div className="flex items-center justify-between px-6 h-16 border-b border-taupe/50">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 text-navy hover:bg-champagne transition-colors"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-col px-6 py-8 gap-1">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'font-display text-[32px] font-semibold py-2 leading-tight transition-colors',
                      isActive ? 'text-sapphire italic' : 'text-navy hover:text-sapphire',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {isLoggedIn && (
                <>
                  <div className="mt-6 pt-6 border-t border-taupe/50 flex flex-col gap-1">
                    <NavLink
                      to="/alerts"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-2 font-sans text-base text-sapphire"
                    >
                      <AlertCircle size={16} /> My alerts
                    </NavLink>
                    {user?.role === 'admin' && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 py-2 font-sans text-base text-sapphire"
                      >
                        <ShieldCheck size={16} /> Admin
                      </NavLink>
                    )}
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false) }}
                      className="flex items-center gap-3 py-2 font-sans text-base text-danger text-left"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </>
              )}

              {!isLoggedIn && (
                <div className="mt-6 pt-6 border-t border-taupe/50 flex gap-3">
                  <button
                    onClick={() => { navigate('/login'); setMenuOpen(false) }}
                    className="flex-1 rounded-full border-[1.5px] border-navy text-navy py-3 font-sans text-[15px] font-medium transition-colors hover:bg-champagne"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { navigate('/register'); setMenuOpen(false) }}
                    className="flex-1 rounded-full bg-navy text-ivory py-3 font-sans text-[15px] font-medium transition-colors hover:bg-sapphire"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
