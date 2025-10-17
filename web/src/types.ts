export type AuthResult = { token: string; role: string }
export type User = { email: string; role: string }
export type Client = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  birthDate?: string | null
  notes?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  allowEmail: boolean
  allowSms: boolean
  allowPhoto: boolean
}

export type ReservationServiceType = 'treatment' | 'consultation'

export type CalendarReservation = {
  id: string
  clientId: string
  clientName: string
  serviceType: ReservationServiceType
  treatmentId?: string | null
  treatmentName?: string | null
  date: string
  startTime: string
  durationMinutes: number
  notes?: string | null
}

export type ClientReservationEntry = {
  id: string
  serviceType: ReservationServiceType
  serviceLabel: string
  start: string
  durationMinutes: number
  status: string
  notes?: string | null
}

export type ClientReservationTimeline = {
  upcoming: ClientReservationEntry[]
  past: ClientReservationEntry[]
}
