import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer, SlimFooter } from './Footer'

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
    </div>
  )
}
