import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useReservationStore } from '@/stores/reservationStore'
import { getNextBusinessDays, generateDefaultTimeSlots, cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react'

export default function DateTimeSelection() {
  const navigate = useNavigate()
  const { pickupDate, pickupTimeSlot, setPickupDate, setPickupTimeSlot, prevStep, nextStep } = useReservationStore()

  const [selectedDate, setSelectedDate] = useState<Date | null>(pickupDate)
  const [selectedTime, setSelectedTime] = useState<string>(pickupTimeSlot)

  // Get next 10 business days (Wednesday and Saturday)
  const businessDays = useMemo(() => getNextBusinessDays(10), [])

  // Generate time slots (11:00-17:00, 1 hour increments)
  const timeSlots = useMemo(() => generateDefaultTimeSlots(), [])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setPickupDate(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setPickupTimeSlot(time)
  }

  const handleBack = () => {
    prevStep()
    navigate('/')
  }

  const handleNext = () => {
    if (!selectedDate || !selectedTime) return
    nextStep()
    navigate('/customer')
  }

  const canProceed = selectedDate && selectedTime

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900">受取日時を選択してください</h2>
        <p className="text-secondary-600 mt-1">ご都合の良い日時をお選びください</p>
      </div>

      {/* Date Selection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium text-secondary-900">受取日</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {businessDays.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const dayOfWeek = format(date, 'E', { locale: ja })

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-center',
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-secondary-200 hover:border-primary-300'
                )}
              >
                <p className="text-sm text-secondary-600">{dayOfWeek}</p>
                <p className="text-lg font-bold">
                  {format(date, 'M/d', { locale: ja })}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium text-secondary-900">受取時間帯</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {timeSlots.map((time) => {
            const isSelected = selectedTime === time

            return (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-center',
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-secondary-200 hover:border-primary-300'
                )}
              >
                <p className="font-medium">{time}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <p className="text-sm text-primary-700">選択された日時</p>
          <p className="font-bold text-lg text-primary-900">
            {format(selectedDate, 'yyyy年MM月dd日 (E)', { locale: ja })} {selectedTime}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleBack}
          className="btn-outline flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          戻る
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-primary flex items-center gap-2"
        >
          お客様情報へ
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
