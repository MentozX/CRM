import { http } from './http'
import type { AuthResult } from '../types'


export async function login(email: string, password: string): Promise<AuthResult> {
return http<AuthResult>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}