/* Root app — providers, router, and route protection */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeProvider'
import { ToastProvider } from './components/ui/Toast'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { ScrollToTop } from './components/ScrollToTop'
import { Loader } from './components/ui/Loader'
import LandingPage from './pages/LandingPage'
import FeedPage from './pages/FeedPage'
import ItemDetailPage from './pages/ItemDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

/* Lazy-loaded routes — loaded only when first visited */
const PostItemPage      = lazy(() => import('./pages/PostItemPage'))
const EditItemPage      = lazy(() => import('./pages/EditItemPage'))
const MyPostsPage       = lazy(() => import('./pages/MyPostsPage'))
const ChatsPage         = lazy(() => import('./pages/ChatsPage'))
const ConversationPage  = lazy(() => import('./pages/ConversationPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const AlertsPage        = lazy(() => import('./pages/AlertsPage'))
const AdminPage         = lazy(() => import('./pages/AdminPage'))
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader size={28} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <ToastProvider>
            <ScrollToTop />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Public routes */}
                  <Route path="/"          element={<LandingPage />} />
                  <Route path="/feed"      element={<FeedPage />} />
                  <Route path="/items/:id" element={<ItemDetailPage />} />
                  <Route path="/login"     element={<LoginPage />} />
                  <Route path="/register"  element={<RegisterPage />} />

                  {/* Protected routes — must be logged in */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/post"           element={<PostItemPage />} />
                    <Route path="/items/:id/edit" element={<EditItemPage />} />
                    <Route path="/my-posts"       element={<MyPostsPage />} />
                    <Route path="/chats"          element={<ChatsPage />} />
                    <Route path="/chats/:id"      element={<ConversationPage />} />
                    <Route path="/notifications"  element={<NotificationsPage />} />
                    <Route path="/alerts"         element={<AlertsPage />} />
                  </Route>

                  {/* Admin-only routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
