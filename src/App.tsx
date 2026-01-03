import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

// Lazy load pages for better performance
const ReservationPage = lazy(() => import('@/pages/reservation'))
const AdminLoginPage = lazy(() => import('@/pages/admin/login'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard'))
const AdminReservationsPage = lazy(() => import('@/pages/admin/reservations'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/customers'))
const AdminProductsPage = lazy(() => import('@/pages/admin/products'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

// Loading component
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-secondary-600">読み込み中...</p>
      </div>
    </div>
  )
}

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* 予約フォーム */}
        <Route path="/*" element={<ReservationPage />} />

        {/* 管理ダッシュボード */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/reservations" element={<AdminReservationsPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
