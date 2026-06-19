import { useState, useEffect, useRef } from 'react'
import { supabase } from '../SupabaseClient'
import { useAuth } from '../AuthContext'
import { Search, Trash2, ShoppingCart, CheckCircle, ImageOff, Printer, Download, Tag, History, X, Clock, Camera, ScanLine } from 'lucide-react'
import { toast } from 'sonner'

function fmt(n) { return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID') }

function formatDateTime(str) {
  var d      = str ? new Date(str) : new Date()
  var days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  var dd     = String(d.getDate()).padStart(2,'0')
  var mm     = months[d.getMonth()]
  var yyyy   = d.getFullYear()
  var hh     = String(d.getHours()).padStart(2,'0')
  var mi     = String(d.getMinutes()).padStart(2,'0')
  return days[d.getDay()] + ', ' + dd + ' ' + mm + ' ' + yyyy + ' · ' + hh + ':' + mi
}

function formatTime(str) {
  var d  = str ? new Date(str) : new Date()
  var hh = String(d.getHours()).padStart(2,'0')
  var mi = String(d.getMinutes()).padStart(2,'0')
  return hh + ':' + mi
}

function ReceiptView(props) {
  var d = props.data
  return (
    <div id="receipt-content" style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000', background: 'white', width: 200, margin: '0 auto', padding: '12px 10px' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 2px', letterSpacing: 1 }}>MINIPOS</p>
        <p style={{ fontSize: 9, margin: '0 0 2px', color: '#333' }}>Point of Sale Mini Market</p>
        <p style={{ fontSize: 9, margin: 0, color: '#555' }}>Jl. Contoh No. 123, Kota</p>
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8, fontSize: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Invoice</span><span style={{ fontWeight: 700 }}>{d.invoice}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Tanggal</span><span>{formatDateTime(d.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir</span><span>{d.cashier}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8 }}>
        {d.items.map(function(item, i) {
          return (
            <div key={i} style={{ marginBottom: 6, fontSize: 9 }}>
              <p style={{ margin: '0 0 1px', fontWeight: 700 }}>{item.product_name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#333' }}>{item.qty} x {fmt(item.price)}</span>
                <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8, fontSize: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Subtotal</span><span>{fmt(d.subtotal)}</span>
        </div>
        {d.diskon > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>Diskon {d.promoKode ? '(' + d.promoKode + ')' : ''}</span>
            <span style={{ fontWeight: 700 }}>- {fmt(d.diskon)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Metode Bayar</span><span>{d.payMethod}</span>
        </div>
        {d.payMethod === 'Tunai' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Uang Diterima</span><span>{fmt(d.cashReceived)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kembalian</span><span style={{ fontWeight: 700 }}>{fmt(d.change)}</span>
            </div>
          </>
        )}
      </div>
      <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 800 }}>TOTAL</span>
        <span style={{ fontSize: 11, fontWeight: 800 }}>{fmt(d.total)}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 9 }}>
        <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Terima kasih!</p>
        <p style={{ color: '#555', margin: '0 0 2px' }}>Barang yang sudah dibeli</p>
        <p style={{ color: '#555', margin: 0 }}>tidak dapat dikembalikan</p>
      </div>
    </div>
  )
}

function ReceiptReprint(props) {
  var t = props.transaction
  if (!t) return null
  var items = t.items || []
  return (
    <div id="reprint-content" style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000', background: 'white', width: 200, margin: '0 auto', padding: '12px 10px' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 2px', letterSpacing: 1 }}>MINIPOS</p>
        <p style={{ fontSize: 9, margin: '0 0 2px', color: '#333' }}>Point of Sale Mini Market</p>
        <p style={{ fontSize: 9, margin: 0, color: '#555' }}>Jl. Contoh No. 123, Kota</p>
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8, fontSize: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Invoice</span><span style={{ fontWeight: 700 }}>{t.invoice_number}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Tanggal</span><span>{formatDateTime(t.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir</span><span>{t.cashier_name || '-'}</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8 }}>
        {items.map(function(item, i) {
          return (
            <div key={i} style={{ marginBottom: 6, fontSize: 9 }}>
              <p style={{ margin: '0 0 1px', fontWeight: 700 }}>{item.product_name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#333' }}>{item.qty} x {fmt(item.price)}</span>
                <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }} />
      <div style={{ marginBottom: 8, fontSize: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Subtotal</span><span>{fmt(t.subtotal || t.total)}</span>
        </div>
        {t.diskon > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>Diskon {t.promo_kode ? '(' + t.promo_kode + ')' : ''}</span>
            <span style={{ fontWeight: 700 }}>- {fmt(t.diskon)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Metode Bayar</span><span>{t.payment_method}</span>
        </div>
        {t.payment_method === 'Tunai' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Uang Diterima</span><span>{fmt(t.cash_received)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kembalian</span><span style={{ fontWeight: 700 }}>{fmt(t.change)}</span>
            </div>
          </>
        )}
      </div>
      <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 800 }}>TOTAL</span>
        <span style={{ fontSize: 11, fontWeight: 800 }}>{fmt(t.total)}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 9 }}>
        <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Terima kasih!</p>
        <p style={{ color: '#555', margin: '0 0 2px' }}>Barang yang sudah dibeli</p>
        <p style={{ color: '#555', margin: 0 }}>tidak dapat dikembalikan</p>
      </div>
    </div>
  )
}

export default function Cashier() {
  var { user } = useAuth()

  var productsState     = useState([])
  var products          = productsState[0]
  var setProducts       = productsState[1]

  var cartState         = useState([])
  var cart              = cartState[0]
  var setCart           = cartState[1]

  var searchState       = useState('')
  var search            = searchState[0]
  var setSearch         = searchState[1]

  var categoryState     = useState('all')
  var category          = categoryState[0]
  var setCategory       = categoryState[1]

  var payDialogState    = useState(false)
  var payDialog         = payDialogState[0]
  var setPayDialog      = payDialogState[1]

  var payMethodState    = useState('Tunai')
  var payMethod         = payMethodState[0]
  var setPayMethod      = payMethodState[1]

  var cashState         = useState('')
  var cashReceived      = cashState[0]
  var setCashReceived   = cashState[1]

  var processingState   = useState(false)
  var processing        = processingState[0]
  var setProcessing     = processingState[1]

  var successState      = useState(null)
  var successData       = successState[0]
  var setSuccessData    = successState[1]

  var receiptState      = useState(false)
  var showReceipt       = receiptState[0]
  var setShowReceipt    = receiptState[1]

  var promoState        = useState(null)
  var promoData         = promoState[0]
  var setPromoData      = promoState[1]

  var promoInputState   = useState('')
  var promoInput        = promoInputState[0]
  var setPromoInput     = promoInputState[1]

  var promoLoadState    = useState(false)
  var promoLoading      = promoLoadState[0]
  var setPromoLoading   = promoLoadState[1]

  var availablePromosState = useState([])
  var availablePromos      = availablePromosState[0]
  var setAvailablePromos   = availablePromosState[1]

  var showHistoryState  = useState(false)
  var showHistory       = showHistoryState[0]
  var setShowHistory    = showHistoryState[1]

  var historyState      = useState([])
  var history           = historyState[0]
  var setHistory        = historyState[1]

  var histLoadState     = useState(false)
  var histLoading       = histLoadState[0]
  var setHistLoading    = histLoadState[1]

  var selectedTxState   = useState(null)
  var selectedTx        = selectedTxState[0]
  var setSelectedTx     = selectedTxState[1]

  // --- STATE SCAN KAMERA ---
  var showScannerState  = useState(false)
  var showScanner       = showScannerState[0]
  var setShowScanner    = showScannerState[1]

  var scannerLoadingState = useState(true)
  var scannerLoading      = scannerLoadingState[0]
  var setScannerLoading   = scannerLoadingState[1]

  var html5QrRef    = useRef(null)
  var searchInputRef = useRef(null)
  var receiptRef     = useRef(null)

  useEffect(function() {
    supabase.from('products').select('*').then(function(res) {
      setProducts(res.data || [])
    })
    supabase.from('promos').select('*').eq('aktif', true).then(function(res) {
      setAvailablePromos(res.data || [])
    })
  }, [])

  async function loadHistory() {
    setHistLoading(true)
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var res = await supabase.from('transactions').select('*').eq('status', 'completed').gte('created_at', today.toISOString()).order('created_at', { ascending: false })
    setHistory(res.data || [])
    setHistLoading(false)
  }

  function openHistory() {
    setShowHistory(true)
    loadHistory()
  }

  var categories = ['all', ...new Set(products.map(function(p) { return p.category }).filter(Boolean))]

  var filtered = products.filter(function(p) {
    var matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)
    var matchCat    = category === 'all' || p.category === category
    return matchSearch && matchCat && p.stock > 0
  })

  var subtotal = cart.reduce(function(s, c) { return s + c.subtotal }, 0)

  function hitungDiskon(sub) {
    if (!promoData) return 0
    var diskon = 0
    if (promoData.jenis === 'persen') {
      diskon = sub * (promoData.nilai / 100)
      if (promoData.max_diskon) diskon = Math.min(diskon, promoData.max_diskon)
    } else {
      diskon = promoData.nilai
    }
    return Math.min(diskon, sub)
  }

  var diskon = hitungDiskon(subtotal)
  var total  = subtotal - diskon
  var change = payMethod === 'Tunai' ? Math.max(0, (parseFloat(cashReceived) || 0) - total) : 0
  var canPay = payMethod !== 'Tunai' || (parseFloat(cashReceived) || 0) >= total

  var eligiblePromos = availablePromos.filter(function(p) {
    if (promoData && promoData.kode === p.kode) return false
    if (cart.length === 0) return false
    if (subtotal < (p.min_transaksi || 0)) return false
    if (p.berlaku_sampai && new Date(p.berlaku_sampai) < new Date()) return false
    return true
  })

  function addToCart(product) {
    setCart(function(prev) {
      var ex = prev.find(function(c) { return c.product_id === product.id })
      if (ex) {
        if (ex.qty >= product.stock) { toast.error('Stok tidak cukup'); return prev }
        return prev.map(function(c) {
          if (c.product_id !== product.id) return c
          return { ...c, qty: c.qty + 1, subtotal: (c.qty + 1) * c.price }
        })
      }
      return [...prev, { product_id: product.id, product_name: product.name, qty: 1, price: product.sell_price, subtotal: product.sell_price, stock: product.stock, image_url: product.image_url }]
    })
  }

  // --- Cari produk berdasarkan barcode hasil scan & tambah ke keranjang ---
  function addByBarcode(code) {
    var matched = products.find(function(p) { return p.barcode === code })
    if (!matched) {
      toast.error('Produk dengan barcode "' + code + '" tidak ditemukan!')
      return false
    }
    if (matched.stock <= 0) {
      toast.error(matched.name + ' stok habis!')
      return false
    }
    addToCart(matched)
    toast.success(matched.name + ' ditambahkan ke keranjang!')
    return true
  }

  // --- Handle Enter dari scanner fisik (USB) di kolom search ---
  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      var code = search.trim()
      if (!code) return
      var added = addByBarcode(code)
      if (added) setSearch('')
    }
  }

  function updateQty(id, delta) {
    setCart(function(prev) {
      return prev.map(function(c) {
        if (c.product_id !== id) return c
        var newQty = c.qty + delta
        if (newQty <= 0) return null
        if (newQty > c.stock) { toast.error('Stok tidak cukup'); return c }
        return { ...c, qty: newQty, subtotal: newQty * c.price }
      }).filter(Boolean)
    })
  }

  function removeFromCart(id) {
    setCart(function(prev) { return prev.filter(function(c) { return c.product_id !== id }) })
  }

  async function checkPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    var res = await supabase.from('promos').select('*').eq('kode', promoInput.trim().toUpperCase()).eq('aktif', true).single()
    if (res.error || !res.data) { toast.error('Kode promo tidak valid!'); setPromoData(null); setPromoLoading(false); return }
    var promo = res.data
    if (promo.berlaku_sampai && new Date(promo.berlaku_sampai) < new Date()) { toast.error('Kode promo sudah expired!'); setPromoData(null); setPromoLoading(false); return }
    if (subtotal < (promo.min_transaksi || 0)) { toast.error('Minimum transaksi ' + fmt(promo.min_transaksi) + ' untuk promo ini!'); setPromoData(null); setPromoLoading(false); return }
    setPromoData(promo)
    toast.success('Promo "' + promo.nama + '" berhasil dipakai!')
    setPromoLoading(false)
  }

  function pakaiPromoOtomatis(p) {
    setPromoData(p)
    setPromoInput(p.kode)
    toast.success('Promo "' + p.nama + '" berhasil dipakai!')
  }

  function hapusPromo() {
    setPromoData(null)
    setPromoInput('')
    toast.success('Promo dihapus!')
  }

  async function processPayment() {
    if (!canPay || cart.length === 0) return
    setProcessing(true)
    var invoiceRes = await supabase.rpc('generate_trx_number')
    var invoice    = invoiceRes.data || 'TRX-' + Date.now().toString(36).toUpperCase()
    var now        = new Date().toISOString()
    var cashAmount = payMethod === 'Tunai' ? parseFloat(cashReceived) : total

    var res = await supabase.from('transactions').insert({
      invoice_number: invoice,
      items:          cart.map(function(c) { return { product_id: c.product_id, product_name: c.product_name, qty: c.qty, price: c.price, subtotal: c.subtotal } }),
      subtotal:       subtotal,
      diskon:         diskon,
      promo_kode:     promoData ? promoData.kode : null,
      total:          total,
      payment_method: payMethod,
      cash_received:  cashAmount,
      change:         payMethod === 'Tunai' ? change : 0,
      status:         'completed',
      cashier_name:   user?.nama || user?.username || 'Kasir',
      created_at:     now,
    })

    if (res.error) { toast.error('Gagal menyimpan transaksi'); setProcessing(false); return }

    for (var i = 0; i < cart.length; i++) {
      var item    = cart[i]
      var product = products.find(function(p) { return p.id === item.product_id })
      if (product) {
        await supabase.from('products').update({ stock: product.stock - item.qty, updated_at: now }).eq('id', item.product_id)
      }
    }

    setSuccessData({
      invoice: invoice, subtotal: subtotal, diskon: diskon, promoKode: promoData ? promoData.kode : null,
      total: total, change: payMethod === 'Tunai' ? change : 0, payMethod: payMethod, cashReceived: cashAmount,
      cashier: user?.nama || user?.username || 'Kasir',
      items: cart.map(function(c) { return { product_name: c.product_name, qty: c.qty, price: c.price, subtotal: c.subtotal } }),
      createdAt: now,
    })

    setCart([])
    setPayDialog(false)
    setCashReceived('')
    setPromoData(null)
    setPromoInput('')
    setProcessing(false)
    var updated = await supabase.from('products').select('*')
    setProducts(updated.data || [])
  }

  function handlePrint() {
    var content = document.getElementById('receipt-content')
    if (!content) return
    var printWin = window.open('', '_blank', 'width=220,height=800')
    printWin.document.write('<html><head><title>Struk</title><style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:"Courier New",Courier,monospace; font-size:9px; line-height:1.3; width:58mm; max-width:58mm; color:#000; } @page { size:58mm auto; margin:2mm 1mm; }</style></head><body>')
    printWin.document.write(content.innerHTML)
    printWin.document.write('</body></html>')
    printWin.document.close()
    printWin.focus()
    setTimeout(function() { printWin.print(); printWin.close() }, 800)
  }

  function handleReprintReceipt() {
    var content = document.getElementById('reprint-content')
    if (!content) return
    var printWin = window.open('', '_blank', 'width=220,height=800')
    printWin.document.write('<html><head><title>Struk</title><style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:"Courier New",Courier,monospace; font-size:9px; line-height:1.3; width:58mm; max-width:58mm; color:#000; } @page { size:58mm auto; margin:2mm 1mm; }</style></head><body>')
    printWin.document.write(content.innerHTML)
    printWin.document.write('</body></html>')
    printWin.document.close()
    printWin.focus()
    setTimeout(function() { printWin.print(); printWin.close() }, 800)
  }

  async function handleDownload() {
    try {
      var content = document.getElementById('receipt-content')
      if (!content) return
      var html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js')).default
      var canvas  = await html2canvas(content, { scale: 2, backgroundColor: '#ffffff' })
      var link    = document.createElement('a')
      link.download = 'struk-' + successData.invoice + '.png'
      link.href   = canvas.toDataURL('image/png')
      link.click()
      toast.success('Struk berhasil didownload!')
    } catch(e) {
      toast.error('Gagal download, coba cetak saja bos!')
    }
  }

  // --- Buka modal scanner kamera & load library html5-qrcode dari CDN ---
  async function openScanner() {
    setShowScanner(true)
    setScannerLoading(true)
  }

  function closeScanner() {
    if (html5QrRef.current) {
      html5QrRef.current.stop().then(function() {
        html5QrRef.current.clear()
        html5QrRef.current = null
      }).catch(function() {})
    }
    setShowScanner(false)
  }

  // Effect: setelah modal scanner muncul, load library & mulai kamera
  useEffect(function() {
    if (!showScanner) return

    var cancelled = false

    function loadScript(src) {
      return new Promise(function(resolve, reject) {
        var existing = document.querySelector('script[src="' + src + '"]')
        if (existing) { resolve(); return }
        var script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    loadScript('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js').then(function() {
      if (cancelled) return
      setScannerLoading(false)
      var Html5Qrcode = window.Html5Qrcode
      if (!Html5Qrcode) { toast.error('Gagal memuat scanner!'); return }

      var qr = new Html5Qrcode('barcode-reader-region')
      html5QrRef.current = qr

      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        function(decodedText) {
          // Berhasil scan
          addByBarcode(decodedText)
          qr.stop().then(function() {
            qr.clear()
            html5QrRef.current = null
            setShowScanner(false)
          }).catch(function() {})
        },
        function() { /* ignore scan failure per frame */ }
      ).catch(function(err) {
        toast.error('Tidak bisa akses kamera: ' + err)
        setScannerLoading(false)
      })
    }).catch(function() {
      toast.error('Gagal memuat library scanner!')
      setScannerLoading(false)
    })

    return function() {
      cancelled = true
      if (html5QrRef.current) {
        html5QrRef.current.stop().then(function() {
          html5QrRef.current.clear()
          html5QrRef.current = null
        }).catch(function() {})
      }
    }
  }, [showScanner])

  var PAYMENT_COLORS = { Tunai: '#6366f1', QRIS: '#22c55e', Debit: '#f97316', Transfer: '#3b82f6' }

  if (successData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: '#eef2ff', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 8px 32px rgba(67,56,202,0.1)', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Transaksi Berhasil!</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 20px' }}>{successData.invoice}</p>
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span><span>{fmt(successData.subtotal)}</span>
            </div>
            {successData.diskon > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#16a34a' }}>Diskon {successData.promoKode ? '(' + successData.promoKode + ')' : ''}</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>- {fmt(successData.diskon)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, paddingTop: successData.diskon > 0 ? 8 : 0, borderTop: successData.diskon > 0 ? '1px solid #e5e7eb' : 'none' }}>
              <span style={{ color: '#6b7280' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{fmt(successData.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Pembayaran</span><span>{successData.payMethod}</span>
            </div>
            {successData.payMethod === 'Tunai' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Uang Diterima</span><span>{fmt(successData.cashReceived)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Kembalian</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>{fmt(successData.change)}</span>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <button onClick={function() { setShowReceipt(!showReceipt) }} style={{ padding: '12px', border: '1px solid #4338ca', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: showReceipt ? '#eef2ff' : 'white', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CheckCircle size={15} />{showReceipt ? 'Sembunyikan' : 'Lihat Struk'}
            </button>
            <button onClick={handlePrint} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'white', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Printer size={15} />Cetak Struk
            </button>
          </div>
          <button onClick={function() { setSuccessData(null); setShowReceipt(false) }} style={{ width: '100%', background: '#4338ca', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Transaksi Baru
          </button>
        </div>
        {showReceipt && (
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(67,56,202,0.1)' }}>
            <div style={{ background: '#f9f9ff', borderBottom: '1px solid #ebebf5', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Preview Struk</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#4338ca', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Download size={13} /> Download PNG
                </button>
                <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Printer size={13} /> Cetak
                </button>
              </div>
            </div>
            <div style={{ padding: 16, background: '#eef2ff', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <ReceiptView data={successData} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', background: '#eef2ff', overflow: 'hidden' }}>

      {/* Sidebar Kategori */}
      <div style={{ width: 160, background: 'white', borderRight: '1px solid #e0e7ff', display: 'flex', flexDirection: 'column', padding: '16px 10px', gap: 4, overflowY: 'auto', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Kategori</p>
        {categories.map(function(cat) {
          var isActive = category === cat
          return (
            <button key={cat} onClick={function() { setCategory(cat) }} style={{ padding: '10px 12px', borderRadius: 10, border: 'none', textAlign: 'left', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', background: isActive ? '#4338ca' : 'transparent', color: isActive ? 'white' : '#374151', transition: 'all 0.15s' }}>
              {cat === 'all' ? 'Semua Produk' : cat}
            </button>
          )
        })}
      </div>

      {/* Area Produk */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', background: 'white', borderBottom: '1px solid #e0e7ff', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              ref={searchInputRef}
              placeholder="Cari produk, atau scan barcode di sini..."
              value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              onKeyDown={handleSearchKeyDown}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1px solid #e0e7ff', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f5f7ff', color: '#111827' }}
            />
          </div>
          {/* Tombol Scan Kamera */}
          <button
            onClick={openScanner}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Camera size={15} /> Scan
          </button>
          {/* Tombol Riwayat */}
          <button
            onClick={openHistory}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <History size={15} /> Riwayat
          </button>
        </div>

        {/* Hint pakai scanner fisik */}
        <div style={{ padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScanLine size={13} color="#a16207" />
          <span style={{ fontSize: 11, color: '#92400e' }}>Pakai scanner fisik? Klik kolom cari di atas lalu scan barcode produk — otomatis masuk keranjang.</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {filtered.map(function(p) {
              var inCart = cart.find(function(c) { return c.product_id === p.id })
              return (
                <button key={p.id} onClick={function() { addToCart(p) }} style={{ background: 'white', border: '1px solid ' + (inCart ? '#4338ca' : '#e0e7ff'), borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'all 0.15s', position: 'relative' }}>
                  {inCart && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#4338ca', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      {inCart.qty}
                    </div>
                  )}
                  <div style={{ width: '100%', height: 110, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><ImageOff size={28} color="#a5b4fc" /><span style={{ fontSize: 9, color: '#a5b4fc', fontWeight: 600 }}>No Image</span></div>
                    }
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 6px' }}>Stok: {p.stock}</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#4338ca', margin: 0 }}>{fmt(p.sell_price)}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Keranjang */}
      <div style={{ width: 320, background: 'white', borderLeft: '1px solid #e0e7ff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #eef2ff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} color="#4338ca" />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Keranjang</h2>
          <div style={{ marginLeft: 'auto', background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
            {cart.length} item
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cart.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
              <p style={{ fontSize: 13 }}>Keranjang kosong</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Klik produk atau scan barcode</p>
            </div>
          )}
          {cart.map(function(item) {
            return (
              <div key={item.product_id} style={{ background: '#f9fafb', border: '1px solid #eef2ff', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {item.image_url ? <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOff size={16} color="#a5b4fc" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{fmt(item.price)} / pcs</p>
                  </div>
                  <button onClick={function() { removeFromCart(item.product_id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={function() { updateQty(item.product_id, -1) }} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #e0e7ff', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#4338ca', fontSize: 16 }}>-</button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={function() { updateQty(item.product_id, 1) }} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #e0e7ff', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#4338ca', fontSize: 16 }}>+</button>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{fmt(item.subtotal)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Keranjang */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #eef2ff' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: promoData ? '#f0fdf4' : '#f5f7ff', border: '1px solid ' + (promoData ? '#86efac' : '#e0e7ff'), borderRadius: 8, padding: '6px 10px' }}>
                <Tag size={13} color={promoData ? '#16a34a' : '#a5b4fc'} />
                <input
                  value={promoInput}
                  onChange={function(e) { setPromoInput(e.target.value.toUpperCase()) }}
                  placeholder="Kode promo..."
                  onKeyDown={function(e) { if (e.key === 'Enter') checkPromo() }}
                  disabled={!!promoData}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: promoData ? '#16a34a' : '#111827', fontWeight: promoData ? 700 : 400 }}
                />
              </div>
              {promoData ? (
                <button onClick={hapusPromo} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Hapus</button>
              ) : (
                <button onClick={checkPromo} disabled={promoLoading || !promoInput.trim()} style={{ padding: '6px 12px', background: promoLoading || !promoInput.trim() ? '#e0e7ff' : '#4338ca', color: promoLoading || !promoInput.trim() ? '#a5b4fc' : 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: promoLoading || !promoInput.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {promoLoading ? '...' : 'Pakai'}
                </button>
              )}
            </div>
            {promoData && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✅ {promoData.nama} — hemat {promoData.jenis === 'persen' ? promoData.nilai + '%' : fmt(promoData.nilai)}
              </div>
            )}
            {!promoData && eligiblePromos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>🎉 Promo Tersedia</p>
                {eligiblePromos.map(function(p) {
                  return (
                    <button key={p.kode} onClick={function() { pakaiPromoOtomatis(p) }} style={{ width: '100%', background: 'linear-gradient(90deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 8, padding: '8px 10px', marginBottom: 5, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={11} color="#16a34a" />
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>{p.kode}</span>
                          <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 5 }}>{p.nama}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#bbf7d0', padding: '2px 8px', borderRadius: 6 }}>
                        -{p.jenis === 'persen' ? p.nilai + '%' : fmt(p.nilai)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {diskon > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                <span>Diskon</span><span>- {fmt(diskon)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #eef2ff' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#4338ca' }}>{fmt(total)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={function() { setPayDialog(true) }}
            style={{ width: '100%', background: cart.length === 0 ? '#e0e7ff' : '#4338ca', color: cart.length === 0 ? '#a5b4fc' : 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Dialog Pembayaran */}
      {payDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Pembayaran</h2>
            <div style={{ background: '#eef2ff', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16 }}>
              {diskon > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>}
              {diskon > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 8 }}><span>Diskon</span><span>- {fmt(diskon)}</span></div>}
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Total Tagihan</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#4338ca', margin: 0 }}>{fmt(total)}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Metode Pembayaran</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['Tunai', 'QRIS', 'Debit', 'Transfer'].map(function(m) {
                  var isActive = payMethod === m
                  return (
                    <button key={m} onClick={function() { setPayMethod(m) }} style={{ padding: '10px', borderRadius: 8, border: '2px solid ' + (isActive ? '#4338ca' : '#e0e7ff'), background: isActive ? '#eef2ff' : 'white', color: isActive ? '#4338ca' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {m === 'Tunai' ? '💵 ' : m === 'QRIS' ? '🔲 ' : m === 'Debit' ? '💳 ' : '🏦 '}{m}
                    </button>
                  )
                })}
              </div>
            </div>
            {payMethod === 'Tunai' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Uang Diterima</label>
                <input type="number" value={cashReceived} onChange={function(e) { setCashReceived(e.target.value) }} placeholder="0" style={{ width: '100%', border: '1px solid #e0e7ff', borderRadius: 10, padding: '12px 14px', fontSize: 20, fontWeight: 800, outline: 'none', boxSizing: 'border-box', color: '#111827', textAlign: 'right' }} />
                {parseFloat(cashReceived) >= total && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Kembalian</span>
                    <span style={{ fontSize: 15, color: '#16a34a', fontWeight: 800 }}>{fmt(change)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={function() { setPayDialog(false) }} style={{ flex: 1, padding: '12px', border: '1px solid #e0e7ff', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>Batal</button>
              <button disabled={!canPay || processing} onClick={processPayment} style={{ flex: 1, padding: '12px', background: !canPay || processing ? '#a5b4fc' : '#4338ca', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: !canPay || processing ? 'not-allowed' : 'pointer' }}>
                {processing ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SCAN BARCODE KAMERA ===== */}
      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #ebebf5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Camera size={18} color="#16a34a" />
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Scan Barcode</p>
              </div>
              <button onClick={closeScanner} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>
            <div style={{ padding: 16 }}>
              {scannerLoading && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                  <p style={{ fontSize: 13 }}>Memuat kamera...</p>
                </div>
              )}
              <div id="barcode-reader-region" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
              <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
                Arahkan kamera ke barcode produk. Produk otomatis masuk ke keranjang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== DIALOG RIWAYAT TRANSAKSI ===== */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={18} color="#4338ca" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Riwayat Transaksi</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Transaksi hari ini · {history.length} transaksi</p>
                </div>
              </div>
              <button onClick={function() { setShowHistory(false); setSelectedTx(null) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {histLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}><p style={{ fontSize: 13 }}>Memuat...</p></div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                  <p style={{ fontSize: 14 }}>Belum ada transaksi hari ini</p>
                </div>
              ) : history.map(function(t) {
                var color    = PAYMENT_COLORS[t.payment_method] || '#9ca3af'
                var isActive = selectedTx && selectedTx.id === t.id
                return (
                  <div key={t.id} onClick={function() { setSelectedTx(isActive ? null : t) }} style={{ background: isActive ? '#eef2ff' : '#f9fafb', border: '1px solid ' + (isActive ? '#c7d2fe' : '#f3f4f6'), borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isActive ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: isActive ? '#c7d2fe' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCart size={16} color="#4338ca" />
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: '#4338ca', margin: 0, fontFamily: 'monospace' }}>{t.invoice_number}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Clock size={10} color="#9ca3af" />
                            <span style={{ fontSize: 10, color: '#9ca3af' }}>{formatTime(t.created_at)}</span>
                            <span style={{ background: color + '18', color: color, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{t.payment_method}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>{fmt(t.total)}</p>
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{(t.items || []).length} item</p>
                      </div>
                    </div>
                    {isActive && (
                      <div>
                        <div style={{ borderTop: '1px solid #e0e7ff', paddingTop: 10, marginBottom: 10 }}>
                          {(t.items || []).map(function(item, i) {
                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', marginBottom: 4 }}>
                                <span>{item.product_name} x{item.qty}</span>
                                <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>
                              </div>
                            )
                          })}
                          {t.diskon > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: 700 }}>
                              <span>Diskon {t.promo_kode ? '(' + t.promo_kode + ')' : ''}</span>
                              <span>- {fmt(t.diskon)}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={function(e) { e.stopPropagation(); handleReprintReceipt() }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: '#4338ca', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <Printer size={14} /> Cetak Struk
                        </button>
                        <div style={{ display: 'none' }}>
                          <ReceiptReprint transaction={selectedTx} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {history.length > 0 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid #eef2ff', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' }}>Transaksi</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{history.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' }}>Total Hari Ini</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#4338ca', margin: 0 }}>{fmt(history.reduce(function(s, t) { return s + (t.total || 0) }, 0))}</p>
                  </div>
                </div>
                <button onClick={loadHistory} style={{ padding: '8px 14px', background: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}