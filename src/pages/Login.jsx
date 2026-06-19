import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { ShoppingCart, Shield } from 'lucide-react'

export default function Login() {
  var modeState    = useState('user')
  var mode         = modeState[0]
  var setMode      = modeState[1]

  var field1State  = useState('')
  var field1       = field1State[0]
  var setField1    = field1State[1]

  var field2State  = useState('')
  var field2       = field2State[0]
  var setField2    = field2State[1]

  var loadingState = useState(false)
  var loading      = loadingState[0]
  var setLoading   = loadingState[1]

  var errorState   = useState('')
  var error        = errorState[0]
  var setError     = errorState[1]

  var auth = useAuth()

  function switchMode(m) {
    setMode(m)
    setField1('')
    setField2('')
    setError('')
  }

  async function handleLogin() {
    if (!field1 || !field2) {
      setError('Semua kolom harus diisi!')
      return
    }
    setLoading(true)
    setError('')

    var result
    if (mode === 'superadmin') {
      result = await auth.loginSuperAdmin(field1, field2)
    } else {
      result = await auth.loginUser(field1, field2)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    window.location.href = '/'
  }

  var isSuperAdmin = mode === 'superadmin'

  var tabActive = {
    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    background: '#6366f1', color: 'white',
  }

  var tabInactive = {
    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: 'transparent', color: '#6b7280',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3730a3 0%, #4338ca 40%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>

  {/* Dekorasi bulatan */}
  <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
  <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
  <div style={{ position: 'absolute', top: '30%', left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <ShoppingCart size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>MiniPOS</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Point of Sale Mini Market</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

          <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            <button style={!isSuperAdmin ? tabActive : tabInactive} onClick={function() { switchMode('user') }}>
              Kasir / Admin
            </button>
            <button style={isSuperAdmin ? tabActive : tabInactive} onClick={function() { switchMode('superadmin') }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Shield size={13} />
                Super Admin
              </div>
            </button>
          </div>

          <div style={{ background: isSuperAdmin ? '#fef3c7' : '#eef2ff', border: '1px solid ' + (isSuperAdmin ? '#fde68a' : '#e0e7ff'), borderRadius: 8, padding: '8px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{isSuperAdmin ? '🔐' : '👤'}</span>
            <span style={{ fontSize: 12, color: isSuperAdmin ? '#92400e' : '#4338ca', fontWeight: 500 }}>
              {isSuperAdmin ? 'Login dengan email & password Supabase' : 'Login dengan username & password sistem'}
            </span>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              {isSuperAdmin ? 'Email' : 'Username'}
            </label>
            <input
              type={isSuperAdmin ? 'email' : 'text'}
              value={field1}
              onChange={function(e) { setField1(e.target.value) }}
              placeholder={isSuperAdmin ? 'email@supabase.com' : 'Masukkan username...'}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={field2}
              onChange={function(e) { setField2(e.target.value) }}
              placeholder="Masukkan password..."
              onKeyDown={function(e) { if (e.key === 'Enter') handleLogin() }}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#a5b4fc' : '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
          MiniPOS v1.0 · {new Date().getFullYear()}
        </p>

      </div>
    </div>
  )
}