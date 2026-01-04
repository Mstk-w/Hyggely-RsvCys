import { type ClassValue, clsx } from 'clsx'
import { format, isWednesday, isSaturday, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'

// クラス名の結合ユーティリティ
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// 価格のフォーマット
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price)
}

// 日付のフォーマット
export function formatDate(date: Date, formatStr: string = 'yyyy年MM月dd日'): string {
  return format(date, formatStr, { locale: ja })
}

// 予約番号の生成
export function generateReservationNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `HYG-${date}-${random}`
}

// 営業日かどうかをチェック（水曜日または土曜日）
export function isBusinessDay(date: Date): boolean {
  return isWednesday(date) || isSaturday(date)
}

// 次の営業日を取得
export function getNextBusinessDays(count: number = 10): Date[] {
  const businessDays: Date[] = []
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  while (businessDays.length < count) {
    currentDate = addDays(currentDate, 1)
    if (isBusinessDay(currentDate)) {
      businessDays.push(new Date(currentDate))
    }
  }

  return businessDays
}

// デフォルトの時間帯を生成（1時間刻み）
// 11:00-17:00 の6枠: 11:00-12:00, 12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00
export function generateDefaultTimeSlots(startHour: number = 11, endHour: number = 17): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`
    slots.push(`${start}-${end}`)
  }
  return slots
}

// 電話番号のバリデーション
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^0\d{9,10}$/
  return phoneRegex.test(phone.replace(/-/g, ''))
}

// メールアドレスのバリデーション
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
