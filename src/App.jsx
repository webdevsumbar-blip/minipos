import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cashier from './pages/Cashier'
import Products from './pages/Products'
import StockManagement from './pages/StockManagement'
import SalesReport from './pages/SalesReport'
import UsersPage from './pages/Users'
import PromosPage from './pages/Promos'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Akses Ditolak</h2>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
          Kamu tidak punya akses ke halaman ini.
        </p>
        <p style={{ fontSize: 12, color: '#c4b5fd', margin: 0 }}>
          Role kamu: <strong>{user.role}</strong>
        </p>
      </div>
    )
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

        {/* Semua role bisa akses */}
        <Route index element={<Dashboard />} />
        <Route path="kasir" element={<Cashier />} />

        {/* Admin, Manager, Super Admin */}
        <Route path="produk" element={
          <RoleRoute roles={['superadmin','admin','manager']}>
            <Products />
          </RoleRoute>
        } />
        <Route path="stok" element={
          <RoleRoute roles={['superadmin','admin','manager']}>
            <StockManagement />
          </RoleRoute>
        } />
        <Route path="laporan" element={
          <RoleRoute roles={['superadmin','admin','manager']}>
            <SalesReport />
          </RoleRoute>
        } />
        <Route path="promo" element={
          <RoleRoute roles={['superadmin','admin','manager']}>
             <PromosPage />
          </RoleRoute>
        } />

        {/* Hanya Super Admin & Admin */}
        <Route path="users" element={
          <RoleRoute roles={['superadmin','admin']}>
            <UsersPage />
          </RoleRoute>
        } />

      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster richColors />
      </Router>
    </AuthProvider>
  )
}