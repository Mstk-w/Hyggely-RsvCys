import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ReservationFormState } from '@/types'

interface ReservationStore extends ReservationFormState {
  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setPickupDate: (date: Date | null) => void
  setPickupTimeSlot: (timeSlot: string) => void
  setCustomerInfo: (info: Partial<ReservationFormState['customerInfo']>) => void
  getTotalAmount: () => number
  getTotalItems: () => number
  reset: () => void
}

const initialState: ReservationFormState = {
  step: 1,
  items: [],
  pickupDate: null,
  pickupTimeSlot: '',
  customerInfo: {
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),

      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      updateItemQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) }
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      setPickupDate: (date) => set({ pickupDate: date }),

      setPickupTimeSlot: (timeSlot) => set({ pickupTimeSlot: timeSlot }),

      setCustomerInfo: (info) =>
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        })),

      getTotalAmount: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      reset: () => set(initialState),
    }),
    {
      name: 'hyggely-reservation',
      partialize: (state) => ({
        items: state.items,
        pickupDate: state.pickupDate,
        pickupTimeSlot: state.pickupTimeSlot,
        customerInfo: state.customerInfo,
      }),
    }
  )
)
