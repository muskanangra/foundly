import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer, SlimFooter } from './Footer'
import { Loader } from '../ui/Loader'

function WakingUpBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => setVisible(true)
    const hide = () => setVisible(false)
    window.addEventListener('foundly:waking', show)
    window.addEventListener('foundly:awake', hide)
    return () => {
      window.removeEventListener('foundly:waking', show)
      window.removeEventListener('foundly:awake', hide)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-taupe bg-ivory px-5 py-3 shadow-lg font-sans text-sm text-sapphire"
    >
      <Loader size={16} />
      Waking up the server&hellip; this takes about a minute on first visit.
    </div>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()

  const isLanding = pathname === '/'
  const isChats = pathname === '/chats' || pathname.startsWith('/chats/')

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      {isLanding && <Footer />}
      {!isLanding && !isChats && <SlimFooter />}
      <WakingUpBanner />
    </div>
  )
}
