import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'

var emptyForm = {
  kode: '', nama: '', jenis: 'persen', nilai: '',
  min_transaksi: '0', max_diskon: '', berlaku_sampai: '', aktif: true
}

function fmt(n) { return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID') }

export default function PromosPage() {
  var promosState   = useState([])
  var promos        = promosState[0]
  var setPromos     = promosState[1]

  var dialogState   = useState(false)
  var showDialog    = dialogState[0]
  var setShowDialog = dialogState[1]

  var formState     = useState(emptyForm)
  var form          = formState[0]
  var setForm       = formState[1]

  var editState     = useState(null)
  var editId        = editState[0]
  var setEditId     = editState[1]

  var savingState   = useState(false)
  var saving        = savingState[0]
  var setSaving     = savingState[1]

  async function load() {
    var res = await supabase.from('promos').select('*').order('created_at', { ascending: false })
    setPromos(res.data || [])
  }

  useEffect(function() { load() }, [])

  function openAdd() {
    setForm(emptyForm); setEditId(null); setShowDialog(true)
  }

  function openEdit(p) {
    setForm({
      kode:          p.kode,
      nama:          p.nama,
      jenis:         p.jenis,
      nilai:         String(p.nilai),
      min_transaksi: String(p.min_transaksi || 0),
      max_diskon:    p.max_diskon ? String(p.max_diskon) : '',
      berlaku_sampai: p.berlaku_sampai || '',
      aktif:         p.aktif,
    })
    setEditId(p.id); setShowDialog(true)
  }

  async function save() {
    if (!form.kode || !form.nama || !form.nilai) {
      toast.error('Kode, nama, dan nilai wajib diisi!'); return
    }
    setSaving(true)
    var data = {
      kode:          form.kode.toUpperCase(),
      nama:          form.nama,
      jenis:         form.jenis,
      nilai:         parseFloat(form.nilai),
      min_transaksi: parseFloat(form.min_transaksi) || 0,
      max_diskon:    form.max_diskon ? parseFloat(form.max_diskon) : null,
      berlaku_sampai: form.berlaku_sampai || null,
      aktif:         form.aktif,
    }
    if (editId) {
      await supabase.from('promos').update(data).eq('id', editId)
      toast.success('Promo diperbarui!')
    } else {
      var check = await supabase.from('promos').select('id').eq('kode', data.kode).single()
      if (check.data) { toast.error('Kode promo sudah ada!'); setSaving(false); return }
      await supabase.from('promos').insert(data)
      toast.success('Promo ditambahkan!')
    }
    setSaving(false); setShowDialog(false); load()
  }

  async function remove(p) {
    if (!window.confirm('Hapus promo "' + p.nama + '"?')) return
    await supabase.from('promos').delete().eq('id', p.id)
    toast.success('Promo dihapus!'); load()
  }

  async function toggleAktif(p) {
    await supabase.from('promos').update({ aktif: !p.aktif }).eq('id', p.id)
    toast.success(p.aktif ? 'Promo dinonaktifkan!' : 'Promo diaktifkan!'); load()
  }

  var inputStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#fafafa' }
  var labelStyle = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Promo & Diskon</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{promos.length} promo terdaftar</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4338ca', color: 'white', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={16} /> Tambah Promo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {promos.map(function(p) {
          var isExpired = p.berlaku_sampai && new Date(p.berlaku_sampai) < new Date()
          return (
            <div key={p.id} style={{ background: 'white', borderRadius: 14, border: '1px solid ' + (p.aktif && !isExpired ? '#e0e7ff' : '#e5e7eb'), overflow: 'hidden' }}>
              <div style={{ background: p.aktif && !isExpired ? '#4338ca' : '#9ca3af', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={16} color="white" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: 1 }}>{p.kode}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                  {p.jenis === 'persen' ? p.nilai + '%' : fmt(p.nilai)}
                </span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{p.nama}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                    Min. transaksi: {fmt(p.min_transaksi)}
                  </p>
                  {p.max_diskon && (
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                      Maks. diskon: {fmt(p.max_diskon)}
                    </p>
                  )}
                  {p.berlaku_sampai && (
                    <p style={{ fontSize: 11, color: isExpired ? '#dc2626' : '#6b7280', margin: 0, fontWeight: isExpired ? 700 : 400 }}>
                      {isExpired ? '⚠️ Expired: ' : 'Berlaku s/d: '}{p.berlaku_sampai}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={function() { toggleAktif(p) }}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: p.aktif ? '#dcfce7' : '#fee2e2', color: p.aktif ? '#16a34a' : '#dc2626' }}
                  >
                    {p.aktif ? '✅ Aktif' : '❌ Nonaktif'}
                  </button>
                  <button onClick={function() { openEdit(p) }} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
                    <Pencil size={13} color="#4338ca" />
                  </button>
                  <button onClick={function() { remove(p) }} style={{ padding: '6px 10px', border: '1px solid #fee2e2', borderRadius: 8, background: '#fef2f2', cursor: 'pointer' }}>
                    <Trash2 size={13} color="#dc2626" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {promos.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <Tag size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>Belum ada promo</p>
          </div>
        )}
      </div>

      {showDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 20 }}>
              {editId ? 'Edit Promo' : 'Tambah Promo Baru'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Kode Promo *</label>
                  <input value={form.kode} onChange={function(e) { setForm(function(p) { return { ...p, kode: e.target.value.toUpperCase() } }) }} placeholder="Contoh: DISKON10" style={inputStyle} disabled={!!editId} />
                </div>
                <div>
                  <label style={labelStyle}>Jenis Diskon *</label>
                  <select value={form.jenis} onChange={function(e) { setForm(function(p) { return { ...p, jenis: e.target.value } }) }} style={inputStyle}>
                    <option value="persen">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nama Promo *</label>
                <input value={form.nama} onChange={function(e) { setForm(function(p) { return { ...p, nama: e.target.value } }) }} placeholder="Contoh: Diskon Akhir Pekan" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nilai {form.jenis === 'persen' ? '(%)' : '(Rp)'} *</label>
                  <input type="number" value={form.nilai} onChange={function(e) { setForm(function(p) { return { ...p, nilai: e.target.value } }) }} placeholder={form.jenis === 'persen' ? '10' : '5000'} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Min. Transaksi (Rp)</label>
                  <input type="number" value={form.min_transaksi} onChange={function(e) { setForm(function(p) { return { ...p, min_transaksi: e.target.value } }) }} placeholder="0" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {form.jenis === 'persen' && (
                  <div>
                    <label style={labelStyle}>Maks. Diskon (Rp)</label>
                    <input type="number" value={form.max_diskon} onChange={function(e) { setForm(function(p) { return { ...p, max_diskon: e.target.value } }) }} placeholder="Opsional" style={inputStyle} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Berlaku Sampai</label>
                  <input type="date" value={form.berlaku_sampai} onChange={function(e) { setForm(function(p) { return { ...p, berlaku_sampai: e.target.value } }) }} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Status Promo</p>
                <button onClick={function() { setForm(function(p) { return { ...p, aktif: !p.aktif } }) }} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: form.aktif ? '#dcfce7' : '#fee2e2', color: form.aktif ? '#16a34a' : '#dc2626' }}>
                  {form.aktif ? '✅ Aktif' : '❌ Nonaktif'}
                </button>
              </div>

            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={function() { setShowDialog(false) }} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? '#a5b4fc' : '#4338ca', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Menyimpan...' : editId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}