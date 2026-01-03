import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import DashboardStats from '@/components/admin/DashboardStats'
import TodayReservations from '@/components/admin/TodayReservations'
import StockAlerts from '@/components/admin/StockAlerts'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { admin, loading, initialize } = useAuthStore()

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login')
    }
  }, [admin, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-secondary-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">ダッシュボード</h1>
          <p className="text-secondary-600 mt-1">
            こんにちは、{admin.name}さん
          </p>
        </div>

        {/* Stats Cards */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Reservations */}
          <TodayReservations />

          {/* Stock Alerts */}
          <StockAlerts />
        </div>
      </div>
    </AdminLayout>
  )
}
