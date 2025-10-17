import { http } from './http'
import type { Client } from '../types'

export type CreateClientPayload = {
  firstName: string
  lastName: string
  phone: string
  email?: string
  birthDate?: string
  notes?: string
  street?: string
  city?: string
  postalCode?: string
  allowEmail: boolean
  allowSms: boolean
  allowPhoto: boolean
}

export async function listClients(q?: string): Promise<Client[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return http<Client[]>(`/api/clients${qs}`)
}

export async function getClient(id: string): Promise<Client> {
  return http<Client>(`/api/clients/${id}`)
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  return http<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function deleteClient(id: string): Promise<void> {
  await http<void>(`/api/clients/${id}`, { method: 'DELETE' })
}

export async function updateClient(id: string, payload: CreateClientPayload): Promise<Client> {
  return http<Client>(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}
