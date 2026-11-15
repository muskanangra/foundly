/* Root app — providers, router, and route protection */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeProvider'
import { ToastProvider } from './components/ui/Toast'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import LandingPage from './pages/LandingPage'
import FeedPage from './pages/FeedPage'
import ItemDetailPage from './pages/ItemDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PostItemPage from './pages/PostItemPage'
import EditItemPage from './pages/EditItemPage'
import MyPostsPage from './pages/MyPostsPage'
import ChatsPage from './pages/ChatsPage'
import ConversationPage from './pages/ConversationPage'
import NotificationsPage from './pages/NotificationsPage'
import AlertsPage from './pages/AlertsPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <ToastProvider>
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
          </ToastProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
