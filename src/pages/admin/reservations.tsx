import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatPrice, cn } from '@/lib/utils'
import type { ReservationStatus } from '@/types'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  X,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  Search,
} from 'lucide-react'

interface ReservationItem {
  productId: string
  name: string
  quantity: number
  price: number
}

interface ReservationData {
  id: string
  reservationNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: ReservationItem[]
  totalAmount: number
  pickupDate: Date
  pickupTimeSlot: string
  status: ReservationStatus
  notes: string
  createdAt: Date
  updatedAt: Date
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

const statusIcons: Record<ReservationStatus, typeof AlertCircle> = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
}

export default function AdminReservationsPage() {
  const navigate = useNavigate()
  const { admin, loading, initialize } = useAuthStore()
  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal
  const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login')
    }
  }, [admin, loading, navigate])

  // Fetch reservations with filters
  useEffect(() => {
    let q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        case 'tomorrow':
          startDate = startOfDay(addDays(now, 1))
          endDate = endOfDay(addDays(now, 1))
          break
        case 'week':
          startDate = startOfDay(now)
          endDate = endOfDay(addDays(now, 7))
          break
        default:
          startDate = startOfDay(now)
          endDate = endOfDay(addDays(now, 365))
      }

      q = query(
        collection(db, 'reservations'),
        where('pickupDate', '>=', Timestamp.fromDate(startDate)),
        where('pickupDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('pickupDate', 'asc')
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let reservationList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        pickupDate: doc.data().pickupDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ReservationData[]

      // Status filter
      if (statusFilter !== 'all') {
        reservationList = reservationList.filter((r) => r.status === statusFilter)
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        reservationList = reservationList.filter(
          (r) =>
            r.reservationNumber.toLowerCase().includes(query) ||
            r.customerName.toLowerCase().includes(query) ||
            r.customerEmail.toLowerCase().includes(query) ||
            r.customerPhone.includes(query)
        )
      }

      setReservations(reservationList)
      setReservationsLoading(false)
    })

    return () => unsubscribe()
  }, [dateFilter, statusFilter, searchQuery])

  const handleStatusChange = async (reservation: ReservationData, newStatus: ReservationStatus) => {
    setIsUpdating(true)
    try {
      await updateDoc(doc(db, 'reservations', reservation.id), {
        status: newStatus,
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenDetail = (reservation: ReservationData) => {
    setSelectedReservation(reservation)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setSelectedReservation(null)
    setIsDetailModalOpen(false)
  }

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
          <h1 className="text-2xl font-bold text-secondary-900">予約管理</h1>
          <p className="text-secondary-600 mt-1">予約の確認・ステータス変更ができます</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="予約番号・お名前・メール・電話で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-secondary-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                className="input-field w-auto"
              >
                <option value="all">全期間</option>
                <option value="today">今日</option>
                <option value="tomorrow">明日</option>
                <option value="week">1週間</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-field w-auto"
            >
              <option value="all">全ステータス</option>
              <option value="pending">確認待ち</option>
              <option value="confirmed">確認済み</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="card overflow-hidden p-0">
          {reservationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
              <Calendar className="h-12 w-12 mb-4" />
              <p>予約がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      予約番号
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      お客様
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">
                      受取日時
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-secondary-700">
                      合計
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {reservations.map((reservation) => {
                    const StatusIcon = statusIcons[reservation.status]
                    return (
                      <tr
                        key={reservation.id}
                        className="hover:bg-secondary-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-medium text-secondary-900">
                            {reservation.reservationNumber}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {reservation.createdAt &&
                              format(reservation.createdAt, 'yyyy/MM/dd HH:mm')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-secondary-900">
                            {reservation.customerName}
                          </p>
                          <p className="text-sm text-secondary-500">
                            {reservation.customerEmail}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-secondary-700">
                            <Calendar className="h-4 w-4 text-primary-600" />
                            <span>
                              {reservation.pickupDate &&
                                format(reservation.pickupDate, 'MM/dd (E)', { locale: ja })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary-500 mt-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{reservation.pickupTimeSlot}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-medium text-secondary-900">
                            {formatPrice(reservation.totalAmount)}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {reservation.items.length}点
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <select
                              value={reservation.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  reservation,
                                  e.target.value as ReservationStatus
                                )
                              }
                              disabled={isUpdating}
                              className={cn(
                                'appearance-none cursor-pointer pl-8 pr-8 py-1.5 rounded-full text-xs font-medium transition-colors border-0 focus:ring-2 focus:ring-primary-500',
                                statusColors[reservation.status]
                              )}
                            >
                              <option value="pending">確認待ち</option>
                              <option value="confirmed">確認済み</option>
                              <option value="completed">完了</option>
                              <option value="cancelled">キャンセル</option>
                            </select>
                            <StatusIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenDetail(reservation)}
                            className="p-2 rounded-lg text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="詳細を見る"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['pending', 'confirmed', 'completed', 'cancelled'] as ReservationStatus[]).map(
            (status) => {
              const count = reservations.filter((r) => r.status === status).length
              const StatusIcon = statusIcons[status]
              return (
                <div key={status} className="card flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      statusColors[status]
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{count}</p>
                    <p className="text-sm text-secondary-500">{statusLabels[status]}</p>
                  </div>
                </div>
              )
            }
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseDetail} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-secondary-900">予約詳細</h2>
                <p className="text-sm text-secondary-500 font-mono">
                  {selectedReservation.reservationNumber}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-600">ステータス</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                    statusColors[selectedReservation.status]
                  )}
                >
                  {React.createElement(statusIcons[selectedReservation.status], {
                    className: 'h-4 w-4',
                  })}
                  {statusLabels[selectedReservation.status]}
                </span>
              </div>

              {/* Customer Info */}
              <div className="card bg-secondary-50">
                <h3 className="font-medium text-secondary-900 mb-4">お客様情報</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary-600" />
                    <span className="text-secondary-700">{selectedReservation.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <a
                      href={`mailto:${selectedReservation.customerEmail}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedReservation.customerEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-600" />
                    <a
                      href={`tel:${selectedReservation.customerPhone}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedReservation.customerPhone}
                    </a>
                  </div>
                  {selectedReservation.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
                      <span className="text-secondary-700">{selectedReservation.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Info */}
              <div className="card bg-secondary-50">
                <h3 className="font-medium text-secondary-900 mb-4">受取日時</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <span className="text-secondary-700">
                      {selectedReservation.pickupDate &&
                        format(selectedReservation.pickupDate, 'yyyy年MM月dd日 (E)', {
                          locale: ja,
                        })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <span className="text-secondary-700">{selectedReservation.pickupTimeSlot}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-secondary-900 mb-4">注文内容</h3>
                <div className="space-y-3">
                  {selectedReservation.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-secondary-100"
                    >
                      <div>
                        <p className="font-medium text-secondary-900">{item.name}</p>
                        <p className="text-sm text-secondary-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-secondary-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 font-bold text-lg">
                    <span>合計</span>
                    <span className="text-primary-700">
                      {formatPrice(selectedReservation.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-secondary-500 space-y-1">
                <p>
                  予約日時:{' '}
                  {selectedReservation.createdAt &&
                    format(selectedReservation.createdAt, 'yyyy年MM月dd日 HH:mm')}
                </p>
                <p>
                  最終更新:{' '}
                  {selectedReservation.updatedAt &&
                    format(selectedReservation.updatedAt, 'yyyy年MM月dd日 HH:mm')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 flex gap-3">
              <button onClick={handleCloseDetail} className="btn-outline flex-1">
                閉じる
              </button>
              {selectedReservation.status === 'pending' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedReservation, 'confirmed')
                    handleCloseDetail()
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  予約を確認
                </button>
              )}
              {selectedReservation.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedReservation, 'completed')
                    handleCloseDetail()
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  完了にする
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
