import type { ReactNode } from 'react'
import { useReservationStore } from '@/stores/reservationStore'
import ProgressBar from './ProgressBar'

interface ReservationLayoutProps {
  children: ReactNode
}

const steps = [
  { number: 1, label: '商品選択' },
  { number: 2, label: '受取日時' },
  { number: 3, label: 'お客様情報' },
  { number: 4, label: '確認' },
  { number: 5, label: '完了' },
]

export default function ReservationLayout({ children }: ReservationLayoutProps) {
  const currentStep = useReservationStore((state) => state.step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-800">Hyggely</h1>
              <p className="text-sm text-secondary-600">カンパーニュ専門店</p>
            </div>
            <div className="text-right text-sm text-secondary-600">
              <p>愛知県みよし市三好丘緑2-10-4</p>
              <p>営業日: 水曜・土曜</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-secondary-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ProgressBar steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary-800 text-white py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">Hyggely - カンパーニュ専門店</p>
          <p className="text-secondary-400">
            © 2024 Hyggely. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
