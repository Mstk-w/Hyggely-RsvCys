import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'
import { Clock, User, Package } from 'lucide-react'
import type { Reservation } from '@/types'

export default function TodayReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const q = query(
      collection(db, 'reservations'),
      where('pickupDate', '>=', Timestamp.fromDate(startOfDay)),
      where('pickupDate', '<', Timestamp.fromDate(endOfDay)),
      orderBy('pickupDate')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        pickupDate: doc.data().pickupDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Reservation[]
      setReservations(reservationList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    pending: '未確認',
    confirmed: '確認済み',
    completed: '受取完了',
    cancelled: 'キャンセル',
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">本日の予約</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-secondary-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-secondary-900">本日の予約</h3>
        <span className="text-sm text-secondary-500">
          {format(new Date(), 'yyyy年MM月dd日', { locale: ja })}
        </span>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          本日の予約はありません
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-secondary-400" />
                    <span className="font-medium">{reservation.customerName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        statusColors[reservation.status]
                      }`}
                    >
                      {statusLabels[reservation.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-600">
                    <Clock className="h-4 w-4" />
                    <span>{reservation.pickupTimeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-600">
                    <Package className="h-4 w-4" />
                    <span>
                      {reservation.items.map((item) => `${item.name}×${item.quantity}`).join(', ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-700">
                    {formatPrice(reservation.totalAmount)}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {reservation.reservationNumber}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
