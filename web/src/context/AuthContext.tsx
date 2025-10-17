import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'


type Ctx = { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; isReady: boolean }
const AuthCtx = createContext<Ctx>({ user: null, login: async () => {}, logout: () => {}, isReady: false })


export function AuthProvider({ children }: { children: ReactNode }) {
const [user, setUser] = useState<User | null>(null)
const [isReady, setIsReady] = useState(false)


useEffect(() => {
const token = localStorage.getItem('token')
const email = localStorage.getItem('email')
const role = localStorage.getItem('role')
if (token && email && role) setUser({ email, role })
setIsReady(true)
}, [])


async function doLogin(email: string, password: string) {
const res = await (await import('../api/auth')).login(email, password)
localStorage.setItem('token', res.token)
localStorage.setItem('email', email)
localStorage.setItem('role', res.role)
setUser({ email, role: res.role })
setIsReady(true)
}


function logout() {
localStorage.removeItem('token')
localStorage.removeItem('email')
localStorage.removeItem('role')
setUser(null)
setIsReady(true)
}


return <AuthCtx.Provider value={{ user, login: doLogin, logout, isReady }}>{children}</AuthCtx.Provider>
}


export function useAuth() {
return useContext(AuthCtx)
}
