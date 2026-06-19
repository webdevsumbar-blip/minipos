import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { Plus, Search, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'

export default function StockManagement() {
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('stock')
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({ product_id: '', type: 'in', qty: '', note: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('stock_history').select('*').order('created_at', { ascending: false }).limit(200)
    ])
    setProducts(p || []); setHistory(h || [])
  }
  useEffect(() => { load() }, [])

  const lowStock = products.filter(p => p.stock <= (p.min_stock || 5))
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const saveStock = async () => {
    if (!form.product_id || !form.qty) { toast.error('Pilih produk dan masukkan jumlah'); return }
    setSaving(true)
    const product = products.find(p => p.id === form.product_id)
    const qty = parseFloat(form.qty)
    const newStock = form.type === 'in' ? product.stock + qty : form.type === 'out' ? Math.max(0, product.stock - qty) : qty
    await supabase.from('stock_history').insert({ product_id: product.id, product_name: product.name, type: form.type, qty, note: form.note, stock_before: product.stock, stock_after: newStock })
    await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', product.id)
    toast.success('Stok berhasil diperbarui')
    setSaving(false); setShowDialog(false); setForm({ product_id: '', type: 'in', qty: '', note: '' }); load()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Manajemen Stok</h1><p className="text-slate-500 text-sm mt-1">Kelola stok masuk & keluar</p></div>
        <button onClick={() => setShowDialog(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"><Plus className="w-4 h-4" />Update Stok</button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 mb-2"><AlertTriangle className="w-4 h-4" /><span className="font-semibold text-sm">Stok Rendah ({lowStock.length} produk)</span></div>
          <div className="flex flex-wrap gap-2">{lowStock.map(p => <span key={p.id} className="text-xs bg-white px-2 py-1 rounded-md border border-amber-200">{p.name}: <strong>{p.stock}</strong></span>)}</div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {['stock', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{t === 'stock' ? 'Stok Produk' : 'Riwayat'}</button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="p-4 font-medium">Produk</th><th className="p-4 font-medium">Kategori</th><th className="p-4 font-medium text-right">Stok</th><th className="p-4 font-medium text-right">Min. Stok</th><th className="p-4 font-medium text-center">Status</th></tr></thead>
              <tbody>{filteredProducts.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-slate-500">{p.category}</td>
                  <td className="p-4 text-right font-bold">{p.stock} {p.unit}</td>
                  <td className="p-4 text-right text-slate-500">{p.min_stock || 5}</td>
                  <td className="p-4 text-center">{p.stock <= (p.min_stock || 5) ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 font-medium">Rendah</span> : <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium">Aman</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="p-4 font-medium">Waktu</th><th className="p-4 font-medium">Produk</th><th className="p-4 font-medium">Tipe</th><th className="p-4 font-medium text-right">Jumlah</th><th className="p-4 font-medium">Perubahan Stok</th><th className="p-4 font-medium">Catatan</th></tr></thead>
            <tbody>{history.map(h => (
              <tr key={h.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-4 text-slate-500 text-xs">{moment(h.created_at).format('DD/MM/YY HH:mm')}</td>
                <td className="p-4 font-medium">{h.product_name}</td>
                <td className="p-4"><span className={`inline-flex items-center gap-1 text-xs font-medium ${h.type === 'in' ? 'text-emerald-600' : h.type === 'out' ? 'text-red-600' : 'text-amber-600'}`}>{h.type === 'in' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}{h.type === 'in' ? 'Masuk' : h.type === 'out' ? 'Keluar' : 'Penyesuaian'}</span></td>
                <td className="p-4 text-right font-bold">{h.qty}</td>
                <td className="p-4 text-xs text-slate-500">{h.stock_before} → {h.stock_after}</td>
                <td className="p-4 text-slate-500 text-xs">{h.note || '-'}</td>
              </tr>
            ))}</tbody>
          </table>
          {history.length === 0 && <p className="text-center text-slate-400 py-12">Belum ada riwayat</p>}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-5">Update Stok</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium block mb-1.5">Produk *</label><select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Pilih produk...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}</select></div>
              <div><label className="text-sm font-medium block mb-1.5">Tipe *</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="in">Stok Masuk</option><option value="out">Stok Keluar</option><option value="adjustment">Penyesuaian (Set Stok)</option></select></div>
              <div><label className="text-sm font-medium block mb-1.5">Jumlah *</label><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="text-sm font-medium block mb-1.5">Catatan</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="flex gap-2"><button onClick={() => setShowDialog(false)} className="flex-1 border rounded-lg py-2.5 text-sm font-semibold hover:bg-slate-50">Batal</button><button onClick={saveStock} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition">{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}