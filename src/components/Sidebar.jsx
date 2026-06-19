import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3, LogOut, Users, Tag } from 'lucide-react'

var allNavItems = [
  { path: '/',        label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin','admin','manager','kasir'] },
  { path: '/kasir',   label: 'Kasir',     icon: ShoppingCart,    roles: ['superadmin','admin','manager','kasir'] },
  { path: '/produk',  label: 'Produk',    icon: Package,         roles: ['superadmin','admin','manager'] },
  { path: '/stok',    label: 'Stok',      icon: Warehouse,       roles: ['superadmin','admin','manager'] },
  { path: '/promo',   label: 'Promo',     icon: Tag,             roles: ['superadmin','admin','manager'] },
  { path: '/laporan', label: 'Laporan',   icon: BarChart3,       roles: ['superadmin','admin','manager'] },
  { path: '/users',   label: 'User',      icon: Users,           roles: ['superadmin','admin'] },
]

var ROLE_INFO = {
  superadmin: { label: 'Super Admin', icon: '👑' },
  admin:      { label: 'Admin',       icon: '🔧' },
  manager:    { label: 'Manager',     icon: '📊' },
  kasir:      { label: 'Kasir',       icon: '🛒' },
}

var NAV_SECTIONS = [
  { label: 'Transaksi', paths: ['/', '/kasir'] },
  { label: 'Inventori', paths: ['/produk', '/stok', '/promo'] },
  { label: 'Laporan',   paths: ['/laporan'] },
  { label: 'Sistem',    paths: ['/users'] },
]

export default function Sidebar() {
  var location = useLocation()
  var auth     = useAuth()
  var user     = auth.user
  var logout   = auth.logout

  var userRole = user ? user.role : 'kasir'
  var roleInfo = ROLE_INFO[userRole] || { label: userRole, icon: '👤' }

  var navItems = allNavItems.filter(function(item) {
    return item.roles.includes(userRole)
  })

  function isActive(path) {
    return location.pathname === path
  }

  return (
    <aside style={{ width: 220, background: '#3730a3', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflowY: 'auto' }}>

      <div style={{ padding: '24px 20px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingCart size={18} color="#3730a3" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0, letterSpacing: 0.5 }}>MiniPOS</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: 1.5 }}>POINT OF SALE</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
            {roleInfo.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user ? user.nama : 'User'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{roleInfo.label}</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_SECTIONS.map(function(section) {
          var sectionItems = navItems.filter(function(item) {
            return section.paths.includes(item.path)
          })
          if (sectionItems.length === 0) return null
          return (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', padding: '6px 10px 4px', margin: 0 }}>
                {section.label}
              </p>
              {sectionItems.map(function(item) {
                var active = isActive(item.path)
                var Icon   = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 400, textDecoration: 'none', background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.55)', transition: 'all 0.15s', borderLeft: active ? '3px solid white' : '3px solid transparent', marginBottom: 2 }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '10px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0, textAlign: 'center', letterSpacing: 1 }}>
            MiniPOS v1.0 · {new Date().getFullYear()}
          </p>
        </div>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>

    </aside>
  )
}