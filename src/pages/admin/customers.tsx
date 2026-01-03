import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatPrice, cn } from '@/lib/utils'
import type { Customer, ReservationStatus } from '@/types'
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  TrendingUp,
  X,
  Eye,
  Loader2,
} from 'lucide-react'

interface ReservationHistory {
  id: string
  reservationNumber: string
  pickupDate: Date
  totalAmount: number
  status: ReservationStatus
  items: { name: string; quantity: number }[]
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  completed: '完了',
  cancelled: 'キャンセル',
}

const statusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-secondary-100 text-secondary-500',
}

export default function AdminCustomersPage() {
  const navigate = useNavigate()
  const { admin, loading, initialize } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [reservationHistory, setReservationHistory] = useState<ReservationHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login')
    }
  }, [admin, loading, navigate])

  // Fetch customers
  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let customerList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Customer[]

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        customerList = customerList.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.phone.includes(query)
        )
      }

      setCustomers(customerList)
      setCustomersLoading(false)
    })

    return () => unsubscribe()
  }, [searchQuery])

  const handleOpenDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailModalOpen(true)
    setHistoryLoading(true)

    // Fetch reservation history
    try {
      const q = query(
        collection(db, 'reservations'),
        where('customerId', '==', customer.id),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        reservationNumber: doc.data().reservationNumber,
        pickupDate: doc.data().pickupDate?.toDate(),
        totalAmount: doc.data().totalAmount,
        status: doc.data().status,
        items: doc.data().items,
      })) as ReservationHistory[]
      setReservationHistory(history)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setSelectedCustomer(null)
    setIsDetailModalOpen(false)
    setReservationHistory([])
  }

  // Stats
  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const totalReservations = customers.reduce((sum, c) => sum + (c.reservationCount || 0), 0)
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">顧客管理</h1>
          <p className="text-secondary-600 mt-1">顧客情報と予約履歴を確認できます</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{totalCustomers}</p>
              <p className="text-sm text-secondary-500">総顧客数</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatPrice(totalRevenue)}</p>
              <p className="text-sm text-secondary-500">累計売上</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{totalReservations}</p>
              <p className="text-sm text-secondary-500">総予約数</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatPrice(avgSpent)}</p>
              <p className="text-sm text-secondary-500">平均購入額</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="お名前・メール・電話で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="card overflow-hidden p-0">
          {customersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
              <Users className="h-12 w-12 mb-4" />
              <p>顧客がいません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      お名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      連絡先
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      予約回数
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-700">
                      累計購入額
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      登録日
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-secondary-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-secondary-900">{customer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-secondary-500 mt-1">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                          {customer.reservationCount || 0}回
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-secondary-900">
                          {formatPrice(customer.totalSpent || 0)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-secondary-600">
                          {customer.createdAt &&
                            format(customer.createdAt, 'yyyy/MM/dd', { locale: ja })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(customer)}
                          className="p-2 rounded-lg text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="詳細を見る"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseDetail} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-secondary-900">顧客詳細</h2>
                <p className="text-sm text-secondary-500">{selectedCustomer.name}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="card bg-secondary-50">
                <h3 className="font-medium text-secondary-900 mb-4">お客様情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary-500">お名前</p>
                    <p className="font-medium text-secondary-900">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">電話番号</p>
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {selectedCustomer.phone}
                    </a>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-secondary-500">メールアドレス</p>
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {selectedCustomer.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-2xl font-bold text-primary-700">
                    {selectedCustomer.reservationCount || 0}
                  </p>
                  <p className="text-sm text-secondary-500">予約回数</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-primary-700">
                    {formatPrice(selectedCustomer.totalSpent || 0)}
                  </p>
                  <p className="text-sm text-secondary-500">累計購入額</p>
                </div>
                <div className="card text-center">
                  <p className="text-2xl font-bold text-primary-700">
                    {selectedCustomer.reservationCount
                      ? formatPrice((selectedCustomer.totalSpent || 0) / selectedCustomer.reservationCount)
                      : '¥0'}
                  </p>
                  <p className="text-sm text-secondary-500">平均購入額</p>
                </div>
              </div>

              {/* Reservation History */}
              <div>
                <h3 className="font-medium text-secondary-900 mb-4">予約履歴</h3>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                ) : reservationHistory.length === 0 ? (
                  <div className="text-center py-8 text-secondary-500">
                    予約履歴がありません
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservationHistory.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium text-secondary-900">
                              {reservation.reservationNumber}
                            </p>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                statusColors[reservation.status]
                              )}
                            >
                              {statusLabels[reservation.status]}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-500 mt-1">
                            {reservation.pickupDate &&
                              format(reservation.pickupDate, 'yyyy年MM月dd日', { locale: ja })}
                            {' ・ '}
                            {reservation.items.map((i) => `${i.name}×${i.quantity}`).join(', ')}
                          </p>
                        </div>
                        <p className="font-medium text-secondary-900">
                          {formatPrice(reservation.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registration Info */}
              <div className="text-sm text-secondary-500">
                <p>
                  登録日:{' '}
                  {selectedCustomer.createdAt &&
                    format(selectedCustomer.createdAt, 'yyyy年MM月dd日 HH:mm')}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4">
              <button onClick={handleCloseDetail} className="btn-outline w-full">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
