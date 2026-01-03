import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/AdminLayout'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { StoreSettings } from '@/types'
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Save,
  Loader2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const dayNames = ['日', '月', '火', '水', '木', '金', '土']

const defaultSettings: StoreSettings = {
  name: 'Hyggely',
  address: '愛知県みよし市',
  phone: '',
  email: '',
  defaultTimeSlots: [
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ],
  regularBusinessDays: [3, 6], // Wednesday and Saturday
  emailTemplates: {
    reservationConfirmation: '',
    reservationCancellation: '',
    reminderEmail: '',
  },
}

export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const { admin, loading, initialize } = useAuthStore()
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login')
    }
  }, [admin, loading, navigate])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() } as StoreSettings)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      } finally {
        setSettingsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      await setDoc(doc(db, 'settings', 'store'), settings)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleBusinessDay = (dayIndex: number) => {
    const currentDays = settings.regularBusinessDays
    if (currentDays.includes(dayIndex)) {
      setSettings({
        ...settings,
        regularBusinessDays: currentDays.filter((d) => d !== dayIndex),
      })
    } else {
      setSettings({
        ...settings,
        regularBusinessDays: [...currentDays, dayIndex].sort(),
      })
    }
  }

  const toggleTimeSlot = (slot: string) => {
    const currentSlots = settings.defaultTimeSlots
    if (currentSlots.includes(slot)) {
      setSettings({
        ...settings,
        defaultTimeSlots: currentSlots.filter((s) => s !== slot),
      })
    } else {
      const allSlots = [
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
      ]
      setSettings({
        ...settings,
        defaultTimeSlots: allSlots.filter(
          (s) => currentSlots.includes(s) || s === slot
        ),
      })
    }
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">店舗設定</h1>
            <p className="text-secondary-600 mt-1">店舗情報と営業設定を管理します</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                保存中...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-5 w-5" />
                保存しました
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                保存
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Store Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Store className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">店舗情報</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                店舗名
              </label>
              <input
                id="name"
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2"
              >
                <MapPin className="h-4 w-4" />
                住所
              </label>
              <input
                id="address"
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="input-field"
                placeholder="愛知県みよし市..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2"
                >
                  <Phone className="h-4 w-4" />
                  電話番号
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="input-field"
                  placeholder="0561-XX-XXXX"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2"
                >
                  <Mail className="h-4 w-4" />
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="input-field"
                  placeholder="info@hyggely.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Days */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">営業日設定</h2>
          </div>

          <p className="text-sm text-secondary-600 mb-4">
            定休日以外の曜日を選択してください
          </p>

          <div className="flex flex-wrap gap-2">
            {dayNames.map((day, index) => (
              <button
                key={index}
                onClick={() => toggleBusinessDay(index)}
                className={cn(
                  'w-12 h-12 rounded-lg font-medium transition-colors',
                  settings.regularBusinessDays.includes(index)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                )}
              >
                {day}
              </button>
            ))}
          </div>

          <p className="text-sm text-secondary-500 mt-4">
            現在の営業日:{' '}
            {settings.regularBusinessDays.length > 0
              ? settings.regularBusinessDays.map((d) => dayNames[d]).join('・')
              : 'なし'}
          </p>
        </div>

        {/* Time Slots */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">受取時間帯</h2>
          </div>

          <p className="text-sm text-secondary-600 mb-4">
            お客様が選択できる受取時間帯を設定します
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              '10:00-11:00',
              '11:00-12:00',
              '12:00-13:00',
              '13:00-14:00',
              '14:00-15:00',
              '15:00-16:00',
              '16:00-17:00',
            ].map((slot) => (
              <button
                key={slot}
                onClick={() => toggleTimeSlot(slot)}
                className={cn(
                  'p-3 rounded-lg text-sm font-medium transition-colors text-center',
                  settings.defaultTimeSlots.includes(slot)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Email Templates */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">メールテンプレート</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="confirmationEmail"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                予約確認メール（追加メッセージ）
              </label>
              <textarea
                id="confirmationEmail"
                value={settings.emailTemplates.reservationConfirmation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailTemplates: {
                      ...settings.emailTemplates,
                      reservationConfirmation: e.target.value,
                    },
                  })
                }
                className="input-field resize-none"
                rows={4}
                placeholder="予約確認メールに追加するメッセージを入力してください（任意）"
              />
            </div>

            <div>
              <label
                htmlFor="cancellationEmail"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                キャンセルメール（追加メッセージ）
              </label>
              <textarea
                id="cancellationEmail"
                value={settings.emailTemplates.reservationCancellation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailTemplates: {
                      ...settings.emailTemplates,
                      reservationCancellation: e.target.value,
                    },
                  })
                }
                className="input-field resize-none"
                rows={4}
                placeholder="キャンセルメールに追加するメッセージを入力してください（任意）"
              />
            </div>
          </div>
        </div>

        {/* Save Button (Mobile) */}
        <div className="lg:hidden">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                保存中...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-5 w-5" />
                保存しました
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                設定を保存
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
