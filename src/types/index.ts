// 商品
export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  category: string
  isAvailable: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// カート商品
export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

// 予約
export interface Reservation {
  id: string
  reservationNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: CartItem[]
  totalAmount: number
  pickupDate: Date
  pickupTimeSlot: string
  status: ReservationStatus
  notes: string
  createdAt: Date
  updatedAt: Date
}

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

// 顧客
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  reservationCount: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

// 営業日
export interface BusinessDay {
  isOpen: boolean
  timeSlots: string[]
  note?: string
}

export interface BusinessDays {
  [day: string]: BusinessDay
}

// 店舗設定
export interface StoreSettings {
  name: string
  address: string
  phone: string
  email: string
  defaultTimeSlots: string[]
  regularBusinessDays: number[] // 0 = Sunday, 3 = Wednesday, 6 = Saturday
  emailTemplates: {
    reservationConfirmation: string
    reservationCancellation: string
    reminderEmail: string
  }
}

// 管理者
export interface Admin {
  id: string
  email: string
  name: string
  role: 'owner' | 'staff'
}

// 予約フォームの状態
export interface ReservationFormState {
  step: number
  items: CartItem[]
  pickupDate: Date | null
  pickupTimeSlot: string
  customerInfo: {
    name: string
    email: string
    phone: string
    notes: string
  }
}

// 時間帯オプション
export interface TimeSlot {
  value: string
  label: string
  available: boolean
}
