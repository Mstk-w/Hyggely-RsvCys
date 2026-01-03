import { Routes, Route, Navigate } from 'react-router-dom'
import { useReservationStore } from '@/stores/reservationStore'
import ReservationLayout from '@/components/reservation/ReservationLayout'
import ProductSelection from '@/components/reservation/ProductSelection'
import DateTimeSelection from '@/components/reservation/DateTimeSelection'
import CustomerInfoForm from '@/components/reservation/CustomerInfoForm'
import ConfirmationPage from '@/components/reservation/ConfirmationPage'
import CompletePage from '@/components/reservation/CompletePage'

export default function ReservationPage() {
  const step = useReservationStore((state) => state.step)

  return (
    <ReservationLayout>
      <Routes>
        <Route index element={<ProductSelection />} />
        <Route path="datetime" element={
          step >= 2 ? <DateTimeSelection /> : <Navigate to="/" replace />
        } />
        <Route path="customer" element={
          step >= 3 ? <CustomerInfoForm /> : <Navigate to="/" replace />
        } />
        <Route path="confirm" element={
          step >= 4 ? <ConfirmationPage /> : <Navigate to="/" replace />
        } />
        <Route path="complete" element={
          step >= 5 ? <CompletePage /> : <Navigate to="/" replace />
        } />
      </Routes>
    </ReservationLayout>
  )
}
