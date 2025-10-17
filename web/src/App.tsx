import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailsPage from './pages/ClientDetailsPage'
import MailboxPage from './pages/MailboxPage'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'


function Shell({ children }: { children: React.ReactNode }) {
const { user, logout } = useAuth()
return (
<div className="shell">
<aside className="sidebar">
<div className="sidebar-header">CRM</div>
{user && (
<nav className="sidebar-nav">
<Link to="/" className="sidebar-link" aria-label="Pulpit" title="Pulpit">
<span className="sidebar-icon">💻</span>
<span>Pulpit</span>
</Link>
<Link to="/clients" className="sidebar-link" aria-label="Klienci" title="Klienci">
<span className="sidebar-icon">👥</span>
<span>Klienci</span>
</Link>
<Link to="/mail" className="sidebar-link" aria-label="Skrzynka" title="Skrzynka">
<span className="sidebar-icon">@</span>
<span>Skrzynka</span>
</Link>
<Link to="/calendar" className="sidebar-link" aria-label="Kalendarz" title="Kalendarz">
<span className="sidebar-icon">🗓️</span>
<span>Kalendarz</span>
</Link>
</nav>
)}
{user && (
<button className="sidebar-logout" onClick={logout}>Wyloguj</button>
)}
</aside>
<div className="layout">
<header className="topbar">
<h1 className="topbar-title">CRM</h1>
</header>
<main className="content">{children}</main>
</div>
</div>
)
}


function Protected({ children }: { children: JSX.Element }) {
const { user, isReady } = useAuth()
if (!isReady) return <div className="card">Ładowanie...</div>
if (!user) return <Navigate to="/login" replace />
return children
}


export default function App() {
return (
<AuthProvider>
<Shell>
<Routes>
<Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/clients" element={<Protected><ClientsPage /></Protected>} />
        <Route path="/clients/:id" element={<Protected><ClientDetailsPage /></Protected>} />
        <Route path="/mail" element={<Protected><MailboxPage /></Protected>} />
        <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
</Routes>
</Shell>
</AuthProvider>
)
}
