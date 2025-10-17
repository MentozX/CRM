import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function LoginPage() {
const { login } = useAuth()
const nav = useNavigate()
const [email, setEmail] = useState('admin@crm.local')
const [password, setPassword] = useState('admin123')
const [error, setError] = useState('')


async function submit(e: FormEvent) {
e.preventDefault()
setError('')
try {
    await login(email, password)
    nav('/')
} catch (e) {
setError('blad logowania')
}
}


return (
<div className="card" style={{ maxWidth: 380, margin: '40px auto' }}>
<h2>Logowanie</h2>
<form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
<input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
<input className="input" placeholder="Haslo" type="password" value={password} onChange={e => setPassword(e.target.value)} />
{error && <div className="badge">{error}</div>}
<button className="button" type="submit">Zaloguj</button>
</form>
</div>
)
}
