import { useState, useEffect, useRef } from 'react'
import { supabase } from '../SupabaseClient'
import { Plus, Search, Pencil, Trash2, Package, ImageOff, Upload, X, Barcode, Printer, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

var CATEGORIES = ['Makanan', 'Minuman', 'Snack', 'Rokok', 'Toiletries', 'Bumbu Dapur', 'Frozen Food', 'Alat Tulis', 'Lainnya']
var UNITS = ['pcs', 'kg', 'liter', 'pack', 'box', 'botol', 'sachet', 'dus']
var emptyForm = { name: '', barcode: '', category: 'Makanan', buy_price: '', sell_price: '', stock: '', unit: 'pcs', min_stock: '5', image_url: '' }

function ProductImage(props) {
  var validState = useState(true)
  var valid      = validState[0]
  var setValid   = validState[1]
  if (props.url && valid) {
    return <img src={props.url} alt={props.name} onError={function() { setValid(false) }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: props.radius || 8 }} />
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0ff', borderRadius: props.radius || 8 }}>
      {props.icon ? props.icon : <ImageOff size={16} color="#c4b5fd" />}
    </div>
  )
}

// Generate barcode otomatis (EAN-13 style, 12 digit + check digit)
function generateBarcode() {
  var digits = ''
  for (var i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10)
  }
  // Hitung check digit EAN-13
  var sum = 0
  for (var j = 0; j < 12; j++) {
    sum += parseInt(digits[j]) * (j % 2 === 0 ? 1 : 3)
  }
  var check = (10 - (sum % 10)) % 10
  return digits + check
}

// Gambar barcode sebagai canvas (Code128-like visual)
function drawBarcode(canvas, code) {
  if (!canvas || !code) return
  var ctx    = canvas.getContext('2d')
  var width  = canvas.width
  var height = canvas.height

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)

  // Encode tiap karakter jadi pola bar sederhana (visual barcode)
  var bars = []
  for (var i = 0; i < code.length; i++) {
    var n = parseInt(code[i])
    // Tiap digit → pola 7 bit (mirip EAN)
    var patterns = [
      [3,2,1,1],[2,2,2,1],[2,1,2,2],[1,4,1,1],[1,1,3,2],
      [1,2,3,1],[1,1,1,4],[1,3,1,2],[1,2,1,3],[3,1,1,2]
    ]
    bars = bars.concat(patterns[n])
  }

  // Tambah guard bar
  var allBars = [1,1,1].concat(bars).concat([1,1,1])
  var totalUnits = allBars.reduce(function(s, b) { return s + b }, 0)
  var unitWidth  = (width - 20) / totalUnits
  var x = 10
  var barHeight = height - 30

  allBars.forEach(function(units, idx) {
    if (idx % 2 === 0) {
      ctx.fillStyle = '#000'
      ctx.fillRect(Math.floor(x), 5, Math.max(1, Math.floor(units * unitWidth)), barHeight)
    }
    x += units * unitWidth
  })

  // Tulis angka di bawah
  ctx.fillStyle = '#000'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(code, width / 2, height - 5)
}

// Komponen tampilan barcode
function BarcodeCanvas(props) {
  var canvasRef = useRef(null)
  useEffect(function() {
    if (canvasRef.current && props.code) {
      drawBarcode(canvasRef.current, props.code)
    }
  }, [props.code])
  return (
    <canvas
      ref={canvasRef}
      width={props.width || 280}
      height={props.height || 100}
      style={{ display: 'block', borderRadius: 4 }}
    />
  )
}

export default function Products() {
  var productsState  = useState([])
  var products       = productsState[0]
  var setProducts    = productsState[1]

  var searchState    = useState('')
  var search         = searchState[0]
  var setSearch      = searchState[1]

  var catState       = useState('all')
  var catFilter      = catState[0]
  var setCatFilter   = catState[1]

  var dialogState    = useState(false)
  var showDialog     = dialogState[0]
  var setShowDialog  = dialogState[1]

  var formState      = useState(emptyForm)
  var form           = formState[0]
  var setForm        = formState[1]

  var editState      = useState(null)
  var editId         = editState[0]
  var setEditId      = editState[1]

  var savingState    = useState(false)
  var saving         = savingState[0]
  var setSaving      = savingState[1]

  var uploadingState = useState(false)
  var uploading      = uploadingState[0]
  var setUploading   = uploadingState[1]

  var previewState   = useState('')
  var previewUrl     = previewState[0]
  var setPreviewUrl  = previewState[1]

  // --- STATE BARCODE ---
  var barcodeDialogState = useState(false)
  var showBarcodeDialog  = barcodeDialogState[0]
  var setShowBarcodeDialog = barcodeDialogState[1]

  var barcodeProductState = useState(null)
  var barcodeProduct      = barcodeProductState[0]
  var setBarcodeProduct   = barcodeProductState[1]

  var barcodePrintQtyState = useState(1)
  var barcodePrintQty      = barcodePrintQtyState[0]
  var setBarcodePrintQty   = barcodePrintQtyState[1]

  var fileRef    = useRef(null)
  var barcodeRef = useRef(null)

  async function load() {
    var res = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(res.data || [])
  }

  useEffect(function() { load() }, [])

  var filtered = products.filter(function(p) {
    var matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)
    var matchCat    = catFilter === 'all' || p.category === catFilter
    return matchSearch && matchCat
  })

  function openEdit(p) {
    setForm({ name: p.name, barcode: p.barcode || '', category: p.category, buy_price: String(p.buy_price || ''), sell_price: String(p.sell_price), stock: String(p.stock), unit: p.unit, min_stock: String(p.min_stock || 5), image_url: p.image_url || '' })
    setPreviewUrl(p.image_url || '')
    setEditId(p.id)
    setShowDialog(true)
  }

  function openAdd() {
    setForm(emptyForm)
    setPreviewUrl('')
    setEditId(null)
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setForm(emptyForm)
    setPreviewUrl('')
    setEditId(null)
  }

  // --- Buka dialog barcode ---
  function openBarcode(p) {
    setBarcodeProduct(p)
    setBarcodePrintQty(1)
    setShowBarcodeDialog(true)
  }

  // --- Generate barcode baru & simpan ke produk ---
  async function handleGenerateBarcode() {
    if (!barcodeProduct) return
    var newCode = generateBarcode()
    var res = await supabase.from('products').update({ barcode: newCode, updated_at: new Date().toISOString() }).eq('id', barcodeProduct.id)
    if (res.error) { toast.error('Gagal simpan barcode!'); return }
    setBarcodeProduct(function(prev) { return { ...prev, barcode: newCode } })
    setProducts(function(prev) { return prev.map(function(p) { return p.id === barcodeProduct.id ? { ...p, barcode: newCode } : p }) })
    toast.success('Barcode baru berhasil digenerate!')
  }

  // --- Print barcode ---
  function handlePrintBarcode() {
    var canvas = document.getElementById('barcode-canvas')
    if (!canvas || !barcodeProduct) return
    var dataUrl  = canvas.toDataURL('image/png')
    var printWin = window.open('', '_blank', 'width=400,height=600')
    var labels   = ''
    for (var i = 0; i < barcodePrintQty; i++) {
      labels += '<div style="display:inline-block;border:1px solid #ddd;padding:8px 12px;margin:4px;border-radius:6px;text-align:center;width:200px;">'
      labels += '<p style="font-size:11px;font-weight:700;margin:0 0 4px;font-family:sans-serif;">' + barcodeProduct.name + '</p>'
      labels += '<img src="' + dataUrl + '" style="width:100%;max-width:180px;" />'
      labels += '<p style="font-size:12px;font-weight:800;margin:4px 0 0;font-family:sans-serif;">Rp ' + (barcodeProduct.sell_price || 0).toLocaleString('id-ID') + '</p>'
      labels += '</div>'
    }
    printWin.document.write('<html><head><title>Label Barcode</title>')
    printWin.document.write('<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:sans-serif; padding:10px; } @media print { body { padding:0; } }</style>')
    printWin.document.write('</head><body>')
    printWin.document.write('<div style="display:flex;flex-wrap:wrap;gap:4px;">' + labels + '</div>')
    printWin.document.write('</body></html>')
    printWin.document.close()
    printWin.focus()
    setTimeout(function() { printWin.print(); printWin.close() }, 800)
  }

  // --- Download barcode sebagai PNG ---
  function handleDownloadBarcode() {
    var canvas = document.getElementById('barcode-canvas')
    if (!canvas || !barcodeProduct) return
    var link      = document.createElement('a')
    link.download = 'barcode-' + barcodeProduct.barcode + '.png'
    link.href     = canvas.toDataURL('image/png')
    link.click()
    toast.success('Barcode berhasil didownload!')
  }

  async function handleFileUpload(e) {
    var file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran foto maksimal 2MB!'); return }
    setUploading(true)
    var ext      = file.name.split('.').pop()
    var fileName = 'product-' + Date.now() + '.' + ext
    var uploadRes = await supabase.storage.from('products').upload(fileName, file, { upsert: true })
    if (uploadRes.error) { toast.error('Gagal upload foto: ' + uploadRes.error.message); setUploading(false); return }
    var urlRes    = supabase.storage.from('products').getPublicUrl(fileName)
    var publicUrl = urlRes.data.publicUrl
    setForm(function(prev) { return { ...prev, image_url: publicUrl } })
    setPreviewUrl(publicUrl)
    toast.success('Foto berhasil diupload!')
    setUploading(false)
  }

  function handleUrlChange(val) {
    setForm(function(prev) { return { ...prev, image_url: val } })
    setPreviewUrl(val)
  }

  function clearImage() {
    setForm(function(prev) { return { ...prev, image_url: '' } })
    setPreviewUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    if (!form.name || !form.sell_price) { toast.error('Nama dan Harga Jual wajib diisi'); return }
    setSaving(true)
    var data = { name: form.name, barcode: form.barcode, category: form.category, buy_price: parseFloat(form.buy_price) || 0, sell_price: parseFloat(form.sell_price), stock: parseFloat(form.stock) || 0, unit: form.unit, min_stock: parseFloat(form.min_stock) || 5, image_url: form.image_url || null, updated_at: new Date().toISOString() }
    if (editId) {
      await supabase.from('products').update(data).eq('id', editId)
      toast.success('Produk diperbarui')
    } else {
      await supabase.from('products').insert(data)
      toast.success('Produk ditambahkan')
    }
    setSaving(false)
    closeDialog()
    load()
  }

  async function remove(id) {
    if (!window.confirm('Yakin hapus produk ini?')) return
    await supabase.from('products').delete().eq('id', id)
    toast.success('Produk dihapus')
    load()
  }

  var inputStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#fafafa' }
  var labelStyle = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Manajemen Produk</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{products.length} produk terdaftar</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input placeholder="Cari nama atau barcode..." value={search} onChange={function(e) { setSearch(e.target.value) }} style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={catFilter} onChange={function(e) { setCatFilter(e.target.value) }} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', color: '#374151' }}>
          <option value="all">Semua Kategori</option>
          {CATEGORIES.map(function(c) { return <option key={c} value={c}>{c}</option> })}
        </select>
      </div>

      {/* Tabel */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f9ff', borderBottom: '1px solid #ebebf5' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Produk</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Kategori</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Barcode</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Harga Beli</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Harga Jual</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Stok</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(p) {
              var isLow = p.stock <= (p.min_stock || 5)
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #ebebf5' }}>
                        <ProductImage url={p.image_url} name={p.name} radius={10} icon={<Package size={18} color="#c4b5fd" />} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#eef2ff', color: '#6366f1', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.barcode
                      ? <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 6, fontSize: 12, color: '#374151' }}>{p.barcode}</code>
                      : <span style={{ fontSize: 11, color: '#d1d5db' }}>Belum ada</span>
                    }
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280' }}>Rp {(p.buy_price || 0).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>Rp {p.sell_price.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: isLow ? '#dc2626' : '#111827', background: isLow ? '#fef2f2' : 'transparent', padding: isLow ? '2px 8px' : '0', borderRadius: 6 }}>
                      {p.stock} {isLow ? '⚠️' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {/* Tombol Barcode */}
                      <button
                        onClick={function() { openBarcode(p) }}
                        title="Barcode Generator"
                        style={{ padding: '7px', border: '1px solid #e0e7ff', borderRadius: 8, background: '#eef2ff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Barcode size={14} color="#6366f1" />
                      </button>
                      <button onClick={function() { openEdit(p) }} style={{ padding: '7px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={14} color="#6366f1" />
                      </button>
                      <button onClick={function() { remove(p.id) }} style={{ padding: '7px', border: '1px solid #fee2e2', borderRadius: 8, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Tidak ada produk ditemukan</p>
          </div>
        )}
      </div>

      {/* ===== DIALOG BARCODE GENERATOR ===== */}
      {showBarcodeDialog && barcodeProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>Barcode Generator</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{barcodeProduct.name}</p>
              </div>
              <button onClick={function() { setShowBarcodeDialog(false) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>

            {/* Preview Barcode */}
            <div style={{ background: '#f9f9ff', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16, border: '1px solid #ebebf5' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>{barcodeProduct.name}</p>
              {barcodeProduct.barcode ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <BarcodeCanvas code={barcodeProduct.barcode} width={280} height={90} />
                </div>
              ) : (
                <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', marginBottom: 8 }}>
                  <p style={{ fontSize: 13 }}>Belum ada barcode — klik Generate</p>
                </div>
              )}
              {/* Canvas tersembunyi untuk export */}
              <div style={{ display: 'none' }}>
                <canvas id="barcode-canvas" width={280} height={90} ref={function(el) {
                  if (el && barcodeProduct.barcode) drawBarcode(el, barcodeProduct.barcode)
                }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', margin: '8px 0 0' }}>
                Rp {(barcodeProduct.sell_price || 0).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Kode barcode */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: 2 }}>
                {barcodeProduct.barcode || '—'}
              </div>
              <button
                onClick={handleGenerateBarcode}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#eef2ff', color: '#6366f1', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={13} /> {barcodeProduct.barcode ? 'Generate Baru' : 'Generate'}
              </button>
            </div>

            {/* Jumlah Label */}
            {barcodeProduct.barcode && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jumlah Label Print</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={function() { setBarcodePrintQty(function(q) { return Math.max(1, q - 1) }) }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#111827', minWidth: 30, textAlign: 'center' }}>{barcodePrintQty}</span>
                  <button onClick={function() { setBarcodePrintQty(function(q) { return Math.min(50, q + 1) }) }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>label</span>
                </div>
              </div>
            )}

            {/* Tombol Aksi */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setShowBarcodeDialog(false) }} style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>
                Tutup
              </button>
              {barcodeProduct.barcode && (
                <>
                  <button onClick={handleDownloadBarcode} style={{ flex: 1, padding: '11px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Download size={14} /> PNG
                  </button>
                  <button onClick={handlePrintBarcode} style={{ flex: 1, padding: '11px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Printer size={14} /> Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog Tambah/Edit Produk */}
      {showDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 24 }}>
              {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nama Produk *</label>
                <input value={form.name} onChange={function(e) { setForm(function(p) { return { ...p, name: e.target.value } }) }} placeholder="Contoh: Indomie Goreng" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Barcode</label>
                <input value={form.barcode} onChange={function(e) { setForm(function(p) { return { ...p, barcode: e.target.value } }) }} placeholder="Opsional" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Kategori</label>
                <select value={form.category} onChange={function(e) { setForm(function(p) { return { ...p, category: e.target.value } }) }} style={inputStyle}>
                  {CATEGORIES.map(function(c) { return <option key={c}>{c}</option> })}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Harga Beli</label>
                <input type="number" value={form.buy_price} onChange={function(e) { setForm(function(p) { return { ...p, buy_price: e.target.value } }) }} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Harga Jual *</label>
                <input type="number" value={form.sell_price} onChange={function(e) { setForm(function(p) { return { ...p, sell_price: e.target.value } }) }} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Stok</label>
                <input type="number" value={form.stock} onChange={function(e) { setForm(function(p) { return { ...p, stock: e.target.value } }) }} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Satuan</label>
                <select value={form.unit} onChange={function(e) { setForm(function(p) { return { ...p, unit: e.target.value } }) }} style={inputStyle}>
                  {UNITS.map(function(u) { return <option key={u}>{u}</option> })}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Stok Minimum Alert</label>
                <input type="number" value={form.min_stock} onChange={function(e) { setForm(function(p) { return { ...p, min_stock: e.target.value } }) }} placeholder="5" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Foto Produk</label>
                {previewUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid #ebebf5', marginBottom: 12 }}>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f5f5ff' }} />
                    <button onClick={clearImage} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 120, borderRadius: 12, border: '2px dashed #ddd6fe', background: '#f9f9ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 6 }}>
                    <ImageOff size={28} color="#c4b5fd" />
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Belum ada foto</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                <button onClick={function() { fileRef.current && fileRef.current.click() }} disabled={uploading} style={{ width: '100%', padding: '11px', border: '1px solid #6366f1', borderRadius: 8, background: uploading ? '#f5f5ff' : '#eef2ff', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                  <Upload size={15} />{uploading ? 'Mengupload...' : 'Upload Foto dari Komputer'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>atau pakai URL</span>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>
                <input value={form.image_url} onChange={function(e) { handleUrlChange(e.target.value) }} placeholder="https://contoh.com/foto-produk.jpg" style={inputStyle} />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>💡 Klik kanan gambar di Google → "Salin alamat gambar" → paste di sini</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={closeDialog} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? '#a5b4fc' : '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Menyimpan...' : editId ? 'Perbarui Produk' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}