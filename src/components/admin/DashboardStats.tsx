import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatPrice } from '@/lib/utils'
import { Calendar, ShoppingBag, Users, TrendingUp } from 'lucide-react'

interface Stats {
  todayReservations: number
  todayRevenue: number
  totalCustomers: number
  monthlyRevenue: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    todayReservations: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Today's reservations
        const todayQuery = query(
          collection(db, 'reservations'),
          where('createdAt', '>=', Timestamp.fromDate(startOfDay))
        )
        const todaySnapshot = await getDocs(todayQuery)
        const todayReservations = todaySnapshot.size
        const todayRevenue = todaySnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().totalAmount || 0),
          0
        )

        // Monthly revenue
        const monthQuery = query(
          collection(db, 'reservations'),
          where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
          where('status', 'in', ['confirmed', 'completed'])
        )
        const monthSnapshot = await getDocs(monthQuery)
        const monthlyRevenue = monthSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().totalAmount || 0),
          0
        )

        // Total customers
        const customersSnapshot = await getDocs(collection(db, 'customers'))
        const totalCustomers = customersSnapshot.size

        setStats({
          todayReservations,
          todayRevenue,
          totalCustomers,
          monthlyRevenue,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: '本日の予約',
      value: stats.todayReservations,
      unit: '件',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: '本日の売上',
      value: formatPrice(stats.todayRevenue),
      unit: '',
      icon: ShoppingBag,
      color: 'bg-green-500',
    },
    {
      label: '今月の売上',
      value: formatPrice(stats.monthlyRevenue),
      unit: '',
      icon: TrendingUp,
      color: 'bg-primary-500',
    },
    {
      label: '総顧客数',
      value: stats.totalCustomers,
      unit: '人',
      icon: Users,
      color: 'bg-purple-500',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-12 w-12 bg-secondary-200 rounded-lg mb-4" />
            <div className="h-4 w-24 bg-secondary-200 rounded mb-2" />
            <div className="h-8 w-20 bg-secondary-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="card">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm text-secondary-600">{stat.label}</p>
            <p className="text-2xl font-bold text-secondary-900">
              {stat.value}{stat.unit}
            </p>
          </div>
        )
      })}
    </div>
  )
}
