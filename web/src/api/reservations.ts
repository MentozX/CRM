import { http } from './http'
import type { CalendarReservation, ClientReservationTimeline, ReservationServiceType } from '../types'

export type CreateReservationPayload = {
  clientId: string
  serviceType: ReservationServiceType
  date: string
  startTime: string
  durationMinutes: number
  notes?: string
}

export type UpdateReservationPayload = {
  serviceType: ReservationServiceType
  durationMinutes: number
  notes?: string
}

export async function listReservations(date: string): Promise<CalendarReservation[]> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : ''
  return http<CalendarReservation[]>(`/api/calendar${qs}`)
}

export async function createReservation(payload: CreateReservationPayload): Promise<CalendarReservation> {
  return http<CalendarReservation>('/api/calendar', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateReservation(id: string, payload: UpdateReservationPayload): Promise<void> {
  await http<void>(`/api/calendar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function deleteReservation(id: string): Promise<void> {
  await http<void>(`/api/calendar/${id}`, { method: 'DELETE' })
}

export async function getClientReservations(clientId: string): Promise<ClientReservationTimeline> {
  return http<ClientReservationTimeline>(`/api/calendar/client/${clientId}`)
}

export async function listReservationsInRange(start: string, end: string): Promise<CalendarReservation[]> {
  const params = new URLSearchParams({ start, end })
  return http<CalendarReservation[]>(`/api/calendar/range?${params.toString()}`)
}
