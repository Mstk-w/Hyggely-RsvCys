import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useReservationStore } from '@/stores/reservationStore'
import { ArrowLeft, ArrowRight, User, Mail, Phone, FileText } from 'lucide-react'

const customerSchema = z.object({
  name: z.string().min(1, 'お名前を入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  phone: z
    .string()
    .min(10, '電話番号を入力してください')
    .regex(/^0\d{9,10}$/, '正しい電話番号を入力してください（ハイフンなし）'),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

export default function CustomerInfoForm() {
  const navigate = useNavigate()
  const { customerInfo, setCustomerInfo, prevStep, nextStep } = useReservationStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      notes: customerInfo.notes,
    },
  })

  const handleBack = () => {
    prevStep()
    navigate('/datetime')
  }

  const onSubmit = (data: CustomerFormData) => {
    setCustomerInfo(data)
    nextStep()
    navigate('/confirm')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900">お客様情報を入力してください</h2>
        <p className="text-secondary-600 mt-1">予約確認のご連絡に使用いたします</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
              <User className="h-4 w-4" />
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="input-field"
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
              <Mail className="h-4 w-4" />
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="input-field"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
              <Phone className="h-4 w-4" />
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="input-field"
              placeholder="09012345678"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
            <p className="text-secondary-500 text-xs mt-1">ハイフンなしで入力してください</p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
              <FileText className="h-4 w-4" />
              備考（任意）
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              className="input-field resize-none"
              rows={3}
              placeholder="アレルギーや特別なご要望があればお書きください"
            />
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-secondary-50 rounded-lg p-4 text-sm text-secondary-600">
          <p>
            入力いただいた個人情報は、予約確認およびお問い合わせ対応のみに使用し、
            第三者への提供は行いません。
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            戻る
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            確認画面へ
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
