import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'
import { useReservationStore } from '@/stores/reservationStore'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Check, Calendar, Clock, User, Mail, Phone, FileText, ShoppingBag } from 'lucide-react'

// Cloud Functions インスタンス（東京リージョン）
const functions = getFunctions(app, 'asia-northeast1')

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { items, pickupDate, pickupTimeSlot, customerInfo, getTotalAmount, prevStep, nextStep } = useReservationStore()

  const handleBack = () => {
    prevStep()
    navigate('/customer')
  }

  const handleSubmit = async () => {
    if (!pickupDate || !pickupTimeSlot) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Cloud Functions の createReservation を呼び出し
      // トランザクション処理で在庫確認・減少・予約作成を一括実行
      const createReservation = httpsCallable<
        {
          items: Array<{
            productId: string
            name: string
            quantity: number
            price: number
            imageUrl?: string
          }>
          pickupDate: string
          pickupTimeSlot: string
          customerInfo: {
            name: string
            email: string
            phone: string
            notes?: string
          }
        },
        { success: boolean; reservationNumber?: string; error?: string }
      >(functions, 'createReservation')

      const result = await createReservation({
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
        pickupDate: pickupDate.toISOString(),
        pickupTimeSlot,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          notes: customerInfo.notes,
        },
      })

      if (!result.data.success) {
        throw new Error(result.data.error || '予約の作成に失敗しました')
      }

      console.log('Reservation created:', result.data.reservationNumber)

      // Success! Move to complete page
      nextStep()
      navigate('/complete')
    } catch (err) {
      console.error('Reservation error:', err)
      // Firebase Functions のエラーメッセージを抽出
      let errorMessage = '予約の送信に失敗しました。もう一度お試しください。'
      if (err instanceof Error) {
        // HttpsError の場合、message に詳細が含まれる
        errorMessage = err.message
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.code === 'functions/failed-precondition') {
        errorMessage = (err as Error).message
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pickupDate) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900">予約内容をご確認ください</h2>
        <p className="text-secondary-600 mt-1">内容に間違いがなければ「予約を確定する」ボタンを押してください</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Order Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium text-secondary-900">ご注文内容</h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between py-2 border-b border-secondary-100">
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-secondary-600">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
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

      {/* Pickup Details */}
      <div className="card">
        <h3 className="font-medium text-secondary-900 mb-4">受取日時</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-secondary-700">
            <Calendar className="h-5 w-5 text-primary-600" />
            <span>{format(pickupDate, 'yyyy年MM月dd日 (E)', { locale: ja })}</span>
          </div>
          <div className="flex items-center gap-2 text-secondary-700">
            <Clock className="h-5 w-5 text-primary-600" />
            <span>{pickupTimeSlot}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="card">
        <h3 className="font-medium text-secondary-900 mb-4">お客様情報</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-secondary-700">
            <User className="h-5 w-5 text-primary-600" />
            <span>{customerInfo.name}</span>
          </div>
          <div className="flex items-center gap-2 text-secondary-700">
            <Mail className="h-5 w-5 text-primary-600" />
            <span>{customerInfo.email}</span>
          </div>
          <div className="flex items-center gap-2 text-secondary-700">
            <Phone className="h-5 w-5 text-primary-600" />
            <span>{customerInfo.phone}</span>
          </div>
          {customerInfo.notes && (
            <div className="flex items-start gap-2 text-secondary-700">
              <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
              <span>{customerInfo.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="btn-outline flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          戻る
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              送信中...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              予約を確定する
            </>
          )}
        </button>
      </div>
    </div>
  )
}
