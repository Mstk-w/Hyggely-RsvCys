import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useReservationStore } from '@/stores/reservationStore'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Calendar, Clock, MapPin, Home } from 'lucide-react'

export default function CompletePage() {
  const { items, pickupDate, pickupTimeSlot, customerInfo, getTotalAmount, reset } = useReservationStore()

  // Reset store after showing completion (with delay to allow user to see info)
  useEffect(() => {
    const timer = setTimeout(() => {
      reset()
    }, 60000) // Reset after 1 minute

    return () => clearTimeout(timer)
  }, [reset])

  if (!pickupDate) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-600">予約情報が見つかりません</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">
          <Home className="h-5 w-5" />
          トップページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-8">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-secondary-900">ご予約ありがとうございます！</h2>
        <p className="text-secondary-600 mt-2">
          予約確認メールを {customerInfo.email} にお送りしました
        </p>
      </div>

      {/* Pickup Info Card */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-bold text-lg text-primary-900 mb-4">受取情報</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary-600" />
            <span className="text-primary-900">
              {format(pickupDate, 'yyyy年MM月dd日 (E)', { locale: ja })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary-600" />
            <span className="text-primary-900">{pickupTimeSlot}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-primary-900 font-medium">Hyggely</p>
              <p className="text-primary-700">愛知県みよし市三好丘緑2-10-4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card">
        <h3 className="font-medium text-secondary-900 mb-4">ご注文内容</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between py-2 border-b border-secondary-100">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-secondary-600">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-bold text-lg">
            <span>合計</span>
            <span className="text-primary-700">{formatPrice(getTotalAmount())}</span>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">ご注意事項</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>・お支払いは店頭でお願いいたします</li>
          <li>・キャンセルの場合は前日までにご連絡ください</li>
          <li>・ご来店の際は予約確認メールをお持ちください</li>
        </ul>
      </div>

      {/* Back to Home */}
      <div className="text-center pt-4">
        <Link 
          to="/" 
          onClick={() => reset()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="h-5 w-5" />
          トップページへ戻る
        </Link>
      </div>
    </div>
  )
}
