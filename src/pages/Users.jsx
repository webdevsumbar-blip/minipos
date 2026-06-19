import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Plus, Pencil, Trash2, Users, Shield, ShoppingCart, BarChart2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

var ROLES = ['admin', 'kasir', 'manager']

var ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', color: '#7c3aed', bg: '#f5f3ff', icon: '👑' },
  admin:      { label: 'Admin',       color: '#2563eb', bg: '#eff6ff', icon: '🔧' },
  manager:    { label: 'Manager',     color: '#0891b2', bg: '#ecfeff', icon: '📊' },
  kasir:      { label: 'Kasir',       color: '#16a34a', bg: '#f0fdf4', icon: '🛒' },
}

var emptyForm = { username: '', password: '', nama: '', role: 'kasir', aktif: true }

function RoleBadge(props) {
  var cfg = ROLE_CONFIG[props.role] || { label: props.role, color: '#9ca3af', bg: '#f9fafb', icon: '👤' }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function StatCard(props) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ebebf5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: props.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {props.icon}
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>{props.value}</p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{props.label}</p>
      </div>
    </div>
  )
}

export default function UsersPage() {
  var usersState   = useState([])
  var users        = usersState[0]
  var setUsers     = usersState[1]

  var loadingState = useState(true)
  var loading      = loadingState[0]
  var setLoading   = loadingState[1]

  var dialogState  = useState(false)
  var showDialog   = dialogState[0]
  var setShowDialog = dialogState[1]

  var formState    = useState(emptyForm)
  var form         = formState[0]
  var setForm      = formState[1]

  var editState    = useState(null)
  var editId       = editState[0]
  var setEditId    = editState[1]

  var savingState  = useState(false)
  var saving       = savingState[0]
  var setSaving    = savingState[1]

  var showPassState = useState(false)
  var showPass      = showPassState[0]
  var setShowPass   = showPassState[1]

  var searchState  = useState('')
  var search       = searchState[0]
  var setSearch    = searchState[1]

  var roleFilter   = useState('all')
  var roleF        = roleFilter[0]
  var setRoleF     = roleFilter[1]

  async function load() {
    setLoading(true)
    var res = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(res.data || [])
    setLoading(false)
  }

  useEffect(function() { load() }, [])

  var filtered = users.filter(function(u) {
    var matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())
    var matchRole   = roleF === 'all' || u.role === roleF
    return matchSearch && matchRole
  })

  var stats = {
    total:   users.length,
    admin:   users.filter(function(u) { return u.role === 'admin' }).length,
    manager: users.filter(function(u) { return u.role === 'manager' }).length,
    kasir:   users.filter(function(u) { return u.role === 'kasir' }).length,
    aktif:   users.filter(function(u) { return u.aktif }).length,
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowPass(false)
    setShowDialog(true)
  }

  function openEdit(u) {
    setForm({
      username: u.username,
      password: u.password,
      nama:     u.nama,
      role:     u.role,
      aktif:    u.aktif,
    })
    setEditId(u.id)
    setShowPass(false)
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setForm(emptyForm)
    setEditId(null)
  }

  async function save() {
    if (!form.username || !form.password || !form.nama) {
      toast.error('Username, password, dan nama wajib diisi!')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter!')
      return
    }

    setSaving(true)

    if (editId) {
      var res = await supabase.from('users').update({
        username: form.username,
        password: form.password,
        nama:     form.nama,
        role:     form.role,
        aktif:    form.aktif,
      }).eq('id', editId)

      if (res.error) { toast.error('Gagal update user!'); setSaving(false); return }
      toast.success('User berhasil diperbarui!')

    } else {
      var checkRes = await supabase.from('users').select('id').eq('username', form.username).single()
      if (checkRes.data) { toast.error('Username sudah dipakai!'); setSaving(false); return }

      var codeRes  = await supabase.rpc('generate_user_number')
      var userCode = codeRes.data || 'USR-????'

      var insRes = await supabase.from('users').insert({
        username:   form.username,
        password:   form.password,
        nama:       form.nama,
        role:       form.role,
        aktif:      form.aktif,
        user_code:  userCode,
        created_at: new Date().toISOString(),
      })
      if (insRes.error) { toast.error('Gagal tambah user!'); setSaving(false); return }
      toast.success('User berhasil ditambahkan!')
    }

    setSaving(false)
    closeDialog()
    load()
  }

  async function toggleAktif(u) {
    var res = await supabase.from('users').update({ aktif: !u.aktif }).eq('id', u.id)
    if (res.error) { toast.error('Gagal update status!'); return }
    toast.success(u.aktif ? 'User dinonaktifkan!' : 'User diaktifkan!')
    load()
  }

  async function remove(u) {
    if (!window.confirm('Yakin hapus user "' + u.nama + '"?')) return
    var res = await supabase.from('users').delete().eq('id', u.id)
    if (res.error) { toast.error('Gagal hapus user!'); return }
    toast.success('User berhasil dihapus!')
    load()
  }

  var inputStyle = {
    width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '10px 12px', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', color: '#111827', background: '#fafafa',
  }
  var labelStyle = {
    fontSize: 12, fontWeight: 700, color: '#374151',
    display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, background: '#f4f4f8', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Manajemen User</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{users.length} user terdaftar</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={16} /> Tambah User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard icon="👥" label="Total User"   value={stats.total}   bg="#eef2ff" />
        <StatCard icon="🔧" label="Admin"        value={stats.admin}   bg="#eff6ff" />
        <StatCard icon="📊" label="Manager"      value={stats.manager} bg="#ecfeff" />
        <StatCard icon="🛒" label="Kasir Aktif"  value={stats.aktif}   bg="#f0fdf4" />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          placeholder="Cari nama atau username..."
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: 'white' }}
        />
        <select
          value={roleF}
          onChange={function(e) { setRoleF(e.target.value) }}
          style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', color: '#374151', background: 'white' }}
        >
          <option value="all">Semua Role</option>
          {ROLES.map(function(r) { return <option key={r} value={r}>{r}</option> })}
        </select>
      </div>

      {/* Tabel */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9ff', borderBottom: '1px solid #ebebf5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Username</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Dibuat</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Memuat...</td>
              </tr>
            ) : filtered.map(function(u) {
              var date = new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{u.nama}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{u.user_code || 'USR-????'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontSize: 12, color: '#374151' }}>
                      {u.username}
                    </code>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <RoleBadge role={u.role} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={function() { toggleAktif(u) }}
                      style={{ padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: u.aktif ? '#dcfce7' : '#fee2e2', color: u.aktif ? '#16a34a' : '#dc2626' }}
                    >
                      {u.aktif ? '✅ Aktif' : '❌ Nonaktif'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280' }}>{date}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        onClick={function() { openEdit(u) }}
                        style={{ padding: '7px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Pencil size={14} color="#6366f1" />
                      </button>
                      <button
                        onClick={function() { remove(u) }}
                        style={{ padding: '7px', border: '1px solid #fee2e2', borderRadius: 8, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>Tidak ada user ditemukan</p>
          </div>
        )}
      </div>

      {/* Dialog Tambah/Edit */}
      {showDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 24 }}>
              {editId ? 'Edit User' : 'Tambah User Baru'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Nama */}
              <div>
                <label style={labelStyle}>Nama Lengkap *</label>
                <input
                  value={form.nama}
                  onChange={function(e) { setForm(function(p) { return { ...p, nama: e.target.value } }) }}
                  placeholder="Contoh: Budi Santoso"
                  style={inputStyle}
                />
              </div>

              {/* Username */}
              <div>
                <label style={labelStyle}>Username *</label>
                <input
                  value={form.username}
                  onChange={function(e) { setForm(function(p) { return { ...p, username: e.target.value } }) }}
                  placeholder="Contoh: budi123"
                  style={inputStyle}
                  disabled={!!editId}
                />
                {editId && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Username tidak bisa diubah</p>}
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password * {editId && <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>(kosongkan jika tidak ingin ganti)</span>}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={function(e) { setForm(function(p) { return { ...p, password: e.target.value } }) }}
                    placeholder="Minimal 6 karakter"
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <button
                    onClick={function() { setShowPass(!showPass) }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={labelStyle}>Role *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {ROLES.map(function(r) {
                    var cfg     = ROLE_CONFIG[r] || {}
                    var isActive = form.role === r
                    return (
                      <button
                        key={r}
                        onClick={function() { setForm(function(p) { return { ...p, role: r } }) }}
                        style={{ padding: '10px 8px', borderRadius: 8, border: '2px solid ' + (isActive ? cfg.color || '#6366f1' : '#e5e7eb'), background: isActive ? (cfg.bg || '#eef2ff') : 'white', color: isActive ? (cfg.color || '#6366f1') : '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{cfg.icon || '👤'}</div>
                        {cfg.label || r}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status Aktif */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 10, padding: '12px 16px' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Status User</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>User nonaktif tidak bisa login</p>
                </div>
                <button
                  onClick={function() { setForm(function(p) { return { ...p, aktif: !p.aktif } }) }}
                  style={{ padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: form.aktif ? '#dcfce7' : '#fee2e2', color: form.aktif ? '#16a34a' : '#dc2626' }}
                >
                  {form.aktif ? '✅ Aktif' : '❌ Nonaktif'}
                </button>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={closeDialog}
                style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}
              >
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{ flex: 1, padding: '12px', background: saving ? '#a5b4fc' : '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Menyimpan...' : editId ? 'Perbarui User' : 'Simpan User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}