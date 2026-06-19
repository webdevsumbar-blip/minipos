import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { TrendingUp, Receipt, DollarSign, ShoppingCart, Calendar, TrendingDown, Package, Printer, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

function fmt(n) { return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID') }
function pct(a, b) { return b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '0%' }

function toDate(str) { return new Date(str) }

function formatDate(d) {
  var dd = String(d.getDate()).padStart(2, '0')
  var mm = String(d.getMonth() + 1).padStart(2, '0')
  return dd + '/' + mm
}

function formatDateInput(d) {
  var dd   = String(d.getDate()).padStart(2, '0')
  var mm   = String(d.getMonth() + 1).padStart(2, '0')
  var yyyy = d.getFullYear()
  return yyyy + '-' + mm + '-' + dd
}

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

function startOfDay(d) { var x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d)   { var x = new Date(d); x.setHours(23,59,59,999); return x }

var today = new Date()

var PERIODS = [
  { value: 'today',  label: 'Hari Ini' },
  { value: 'week',   label: '7 Hari' },
  { value: 'month',  label: 'Bulan Ini' },
  { value: 'custom', label: 'Pilih Tanggal' },
  { value: 'all',    label: 'Semua Data' },
]

var PAYMENT_COLORS = { Tunai: '#6366f1', QRIS: '#22c55e', Debit: '#f97316', Transfer: '#3b82f6' }

var TABS = [
  { value: 'penjualan',  label: '📊 Laporan Penjualan' },
  { value: 'labarugi',   label: '💰 Laporan Laba Rugi' },
]

function StatCard(props) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>{props.label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: props.valueColor || '#111827', margin: 0 }}>{props.value}</p>
        {props.sub && <p style={{ fontSize: 12, color: props.subColor || '#9ca3af', margin: '4px 0 0', fontWeight: 500 }}>{props.sub}</p>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: props.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {props.icon}
      </div>
    </div>
  )
}

// Komponen struk untuk cetak ulang
function ReceiptView(props) {
  var t = props.transaction
  if (!t) return null
  var items = t.items || []
  return (
    <div id="reprint-receipt" style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#000', background: 'white', width: 200, margin: '0 auto', padding: '12px 10px' }}>
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
        {(t.diskon > 0) && (
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

export default function SalesReport() {
  var txState         = useState([])
  var transactions    = txState[0]
  var setTransactions = txState[1]

  var prodState       = useState([])
  var products        = prodState[0]
  var setProducts     = prodState[1]

  var periodState     = useState('today')
  var period          = periodState[0]
  var setPeriod       = periodState[1]

  var startState      = useState(formatDateInput(today))
  var startDate       = startState[0]
  var setStartDate    = startState[1]

  var endState        = useState(formatDateInput(today))
  var endDate         = endState[0]
  var setEndDate      = endState[1]

  var loadingState    = useState(true)
  var loading         = loadingState[0]
  var setLoading      = loadingState[1]

  var chartTypeState  = useState('bar')
  var chartType       = chartTypeState[0]
  var setChartType    = chartTypeState[1]

  var tabState        = useState('penjualan')
  var activeTab       = tabState[0]
  var setActiveTab    = tabState[1]

  // --- STATE untuk cetak struk ulang ---
  var selectedTxState = useState(null)
  var selectedTx      = selectedTxState[0]
  var setSelectedTx   = selectedTxState[1]

  useEffect(function() {
    setLoading(true)
    Promise.all([
      supabase.from('transactions').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(2000),
      supabase.from('products').select('*'),
    ]).then(function(results) {
      setTransactions(results[0].data || [])
      setProducts(results[1].data || [])
      setLoading(false)
    })
  }, [])

  function getFiltered() {
    return transactions.filter(function(t) {
      var d = toDate(t.created_at)
      if (period === 'today') return d >= startOfDay(today) && d <= endOfDay(today)
      if (period === 'week') {
        var weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6)
        return d >= startOfDay(weekAgo) && d <= endOfDay(today)
      }
      if (period === 'month') {
        var m = new Date(today.getFullYear(), today.getMonth(), 1)
        return d >= startOfDay(m) && d <= endOfDay(today)
      }
      if (period === 'custom') {
        return d >= startOfDay(new Date(startDate)) && d <= endOfDay(new Date(endDate))
      }
      return true
    })
  }

  var filtered   = getFiltered()
  var totalSales = filtered.reduce(function(s, t) { return s + (t.total || 0) }, 0)
  var totalTx    = filtered.length
  var totalItems = filtered.reduce(function(s, t) { return s + (t.items ? t.items.length : 0) }, 0)
  var avgTx      = totalTx > 0 ? totalSales / totalTx : 0

  var chartData = (function() {
    var map = {}
    filtered.forEach(function(t) {
      var key = formatDate(toDate(t.created_at))
      if (!map[key]) map[key] = { date: key, total: 0, count: 0 }
      map[key].total += (t.total || 0)
      map[key].count += 1
    })
    return Object.values(map).sort(function(a, b) {
      return a.date.split('/').reverse().join('').localeCompare(b.date.split('/').reverse().join(''))
    })
  })()

  var productMap = {}
  filtered.forEach(function(t) {
    var items = t.items || []
    items.forEach(function(item) {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
      }
      productMap[item.product_name].qty     += item.qty
      productMap[item.product_name].revenue += item.subtotal
    })
  })
  var topProducts = Object.values(productMap).sort(function(a, b) { return b.revenue - a.revenue }).slice(0, 10)

  var paymentMap = {}
  filtered.forEach(function(t) {
    var m = t.payment_method || 'Lainnya'
    paymentMap[m] = (paymentMap[m] || 0) + (t.total || 0)
  })

  // === LABA RUGI ===
  var labaRugiMap = {}
  filtered.forEach(function(t) {
    var items = t.items || []
    items.forEach(function(item) {
      var prodData = products.find(function(p) { return p.id === item.product_id })
      var buyPrice = prodData ? (prodData.buy_price || 0) : 0
      var key      = item.product_name
      if (!labaRugiMap[key]) {
        labaRugiMap[key] = { name: key, qty: 0, revenue: 0, modal: 0, laba: 0, buyPrice: buyPrice, sellPrice: item.price }
      }
      labaRugiMap[key].qty     += item.qty
      labaRugiMap[key].revenue += item.subtotal
      labaRugiMap[key].modal   += buyPrice * item.qty
      labaRugiMap[key].laba    += item.subtotal - (buyPrice * item.qty)
    })
  })

  var labaRugiList = Object.values(labaRugiMap).sort(function(a, b) { return b.laba - a.laba })
  var totalModal   = labaRugiList.reduce(function(s, p) { return s + p.modal }, 0)
  var totalLaba    = labaRugiList.reduce(function(s, p) { return s + p.laba }, 0)
  var marginLaba   = totalSales > 0 ? (totalLaba / totalSales) * 100 : 0

  // --- Fungsi cetak struk ulang ---
  function handleReprintReceipt() {
    var content = document.getElementById('reprint-receipt')
    if (!content) return
    var printWin = window.open('', '_blank', 'width=220,height=800')
    printWin.document.write('<html><head><title>Struk</title>')
    printWin.document.write('<style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:"Courier New",Courier,monospace; font-size:9px; line-height:1.3; width:58mm; max-width:58mm; color:#000; } @page { size:58mm auto; margin:2mm 1mm; } @media print { html,body { width:58mm; max-width:58mm; font-size:9px; } }</style>')
    printWin.document.write('</head><body>')
    printWin.document.write(content.innerHTML)
    printWin.document.write('</body></html>')
    printWin.document.close()
    printWin.focus()
    setTimeout(function() { printWin.print(); printWin.close() }, 800)
  }

  var periodText = (PERIODS.find(function(p) { return p.value === period }) || {}).label || ''
  var inputStyle = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', color: '#111827', background: 'white' }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, background: '#f4f4f8', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Laporan Keuangan</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
            {loading ? 'Memuat data...' : totalTx + ' transaksi · ' + periodText}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIODS.map(function(p) {
            var isActive = period === p.value
            return (
              <button
                key={p.value}
                onClick={function() { setPeriod(p.value) }}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid ' + (isActive ? '#6366f1' : '#e5e7eb'), background: isActive ? '#6366f1' : 'white', color: isActive ? 'white' : '#374151', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {p.value === 'custom' && <Calendar size={13} />}
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Date */}
      {period === 'custom' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Dari Tanggal</label>
              <input type="date" value={startDate} max={endDate} onChange={function(e) { setStartDate(e.target.value) }} style={inputStyle} />
            </div>
            <div style={{ color: '#9ca3af', fontWeight: 700 }}>—</div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Sampai Tanggal</label>
              <input type="date" value={endDate} min={startDate} max={formatDateInput(today)} onChange={function(e) { setEndDate(e.target.value) }} style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch */}
      <div style={{ display: 'flex', gap: 8 }}>
        {TABS.map(function(tab) {
          var isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={function() { setActiveTab(tab.value) }}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid ' + (isActive ? '#6366f1' : '#e5e7eb'), background: isActive ? '#6366f1' : 'white', color: isActive ? 'white' : '#374151', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer' }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ===== TAB PENJUALAN ===== */}
      {activeTab === 'penjualan' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard label="Total Penjualan"       value={fmt(totalSales)} bg="#eef2ff" icon={<DollarSign size={20} color="#6366f1" />} />
            <StatCard label="Jumlah Transaksi"      value={totalTx}         bg="#f0fdf4" icon={<Receipt size={20} color="#16a34a" />} />
            <StatCard label="Total Item Terjual"    value={totalItems}      bg="#fef9c3" icon={<ShoppingCart size={20} color="#ca8a04" />} />
            <StatCard label="Rata-rata / Transaksi" value={fmt(avgTx)}      bg="#fef2f2" icon={<TrendingUp size={20} color="#dc2626" />} />
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Grafik Penjualan</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Total pendapatan per hari</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['bar', 'line'].map(function(ct) {
                  return (
                    <button key={ct} onClick={function() { setChartType(ct) }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + (chartType === ct ? '#6366f1' : '#e5e7eb'), background: chartType === ct ? '#eef2ff' : 'white', color: chartType === ct ? '#6366f1' : '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {ct === 'bar' ? 'Bar' : 'Line'}
                    </button>
                  )
                })}
              </div>
            </div>
            {chartData.length === 0 ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <p>Belum ada data penjualan</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: '#9ca3af' }} />
                    <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={function(v) { return (v/1000).toFixed(0)+'k' }} />
                    <Tooltip formatter={function(v) { return [fmt(v), 'Penjualan'] }} contentStyle={{ borderRadius: 10, border: '1px solid #ebebf5', fontSize: 12 }} />
                    <Bar dataKey="total" fill="#6366f1" radius={[6,6,0,0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: '#9ca3af' }} />
                    <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={function(v) { return (v/1000).toFixed(0)+'k' }} />
                    <Tooltip formatter={function(v) { return [fmt(v), 'Penjualan'] }} contentStyle={{ borderRadius: 10, border: '1px solid #ebebf5', fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>Produk Terlaris</h2>
              {topProducts.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>Belum ada data</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topProducts.map(function(p, i) {
                    var p2 = totalSales > 0 ? (p.revenue / totalSales) * 100 : 0
                    return (
                      <div key={p.name}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? '#eef2ff' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i < 3 ? '#6366f1' : '#9ca3af', flexShrink: 0 }}>{i+1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p.qty} terjual</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flexShrink: 0 }}>{fmt(p.revenue)}</span>
                        </div>
                        <div style={{ height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: p2 + '%', background: '#6366f1', borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>Metode Pembayaran</h2>
              {Object.keys(paymentMap).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>Belum ada data</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(paymentMap).sort(function(a, b) { return b[1]-a[1] }).map(function(entry) {
                    var method = entry[0]; var amount = entry[1]
                    var p2     = totalSales > 0 ? (amount/totalSales)*100 : 0
                    var color  = PAYMENT_COLORS[method] || '#9ca3af'
                    return (
                      <div key={method}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{method}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: 0 }}>{fmt(amount)}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p2.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: p2+'%', background: color, borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Transaksi — dengan tombol cetak struk */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Riwayat Transaksi</h2>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} transaksi</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9f9ff' }}>
                    {['Invoice','Tanggal & Waktu','Kasir','Pembayaran','Item','Total','Aksi'].map(function(h) {
                      return <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Item' || h === 'Aksi' ? 'center' : h === 'Total' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map(function(t) {
                    var d     = toDate(t.created_at)
                    var date  = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    var time  = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    var color = PAYMENT_COLORS[t.payment_method] || '#9ca3af'
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{t.invoice_number}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 13 }}>{date}</p>
                          <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>{time}</p>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{t.cashier_name || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: color+'18', color: color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{t.payment_method}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#374151' }}>{t.items ? t.items.length : 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>{fmt(t.total)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={function() { setSelectedTx(t) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#eef2ff', color: '#6366f1', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Printer size={13} /> Struk
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                  <p style={{ fontSize: 14 }}>Tidak ada transaksi</p>
                </div>
              )}
              {filtered.length > 50 && (
                <p style={{ textAlign: 'center', padding: '12px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
                  Menampilkan 50 dari {filtered.length} transaksi
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== TAB LABA RUGI ===== */}
      {activeTab === 'labarugi' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard label="Total Pendapatan" value={fmt(totalSales)} bg="#eef2ff" icon={<DollarSign size={20} color="#6366f1" />} />
            <StatCard label="Total Modal" value={fmt(totalModal)} bg="#fef2f2" icon={<TrendingDown size={20} color="#dc2626" />} valueColor="#dc2626" />
            <StatCard label="Total Laba Bersih" value={fmt(totalLaba)} bg={totalLaba >= 0 ? '#f0fdf4' : '#fef2f2'} icon={<TrendingUp size={20} color={totalLaba >= 0 ? '#16a34a' : '#dc2626'} />} valueColor={totalLaba >= 0 ? '#16a34a' : '#dc2626'} sub={totalLaba >= 0 ? '✅ Untung' : '❌ Rugi'} subColor={totalLaba >= 0 ? '#16a34a' : '#dc2626'} />
            <StatCard label="Margin Laba" value={marginLaba.toFixed(1) + '%'} bg="#fef9c3" icon={<Package size={20} color="#ca8a04" />} sub={labaRugiList.length + ' produk terjual'} />
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 20px' }}>Ringkasan Laba Rugi</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ background: '#eef2ff', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Pendapatan</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', margin: 0 }}>{fmt(totalSales)}</p>
                <p style={{ fontSize: 11, color: '#818cf8', margin: '4px 0 0' }}>Total penjualan</p>
              </div>
              <div style={{ background: '#fef2f2', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Modal / HPP</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', margin: 0 }}>{fmt(totalModal)}</p>
                <p style={{ fontSize: 11, color: '#fca5a5', margin: '4px 0 0' }}>Harga pokok penjualan</p>
              </div>
              <div style={{ background: totalLaba >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: totalLaba >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{totalLaba >= 0 ? 'Laba Bersih' : 'Rugi'}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: totalLaba >= 0 ? '#16a34a' : '#dc2626', margin: 0 }}>{fmt(Math.abs(totalLaba))}</p>
                <p style={{ fontSize: 11, color: totalLaba >= 0 ? '#86efac' : '#fca5a5', margin: '4px 0 0' }}>Margin {marginLaba.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Laba per Produk</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Berdasarkan harga beli & harga jual</p>
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{labaRugiList.length} produk</span>
            </div>
            {labaRugiList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 14 }}>Belum ada data transaksi</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Pastikan harga beli sudah diisi di halaman Produk</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9f9ff' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left',   fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Produk</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Qty</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Harga Beli</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Harga Jual</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Total Modal</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Total Pendapatan</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Laba</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labaRugiList.map(function(p) {
                      var isUntung = p.laba >= 0
                      var margin   = p.revenue > 0 ? (p.laba / p.revenue) * 100 : 0
                      return (
                        <tr key={p.name} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111827' }}>{p.name}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#374151' }}>{p.qty}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280' }}>{fmt(p.buyPrice)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280' }}>{fmt(p.sellPrice)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#dc2626' }}>{fmt(p.modal)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6366f1', fontWeight: 700 }}>{fmt(p.revenue)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: isUntung ? '#16a34a' : '#dc2626' }}>
                            {isUntung ? '+' : '-'}{fmt(Math.abs(p.laba))}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ background: isUntung ? '#f0fdf4' : '#fef2f2', color: isUntung ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f9f9ff', borderTop: '2px solid #ebebf5' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#111827' }}>TOTAL</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>{labaRugiList.reduce(function(s,p) { return s+p.qty }, 0)}</td>
                      <td style={{ padding: '12px 16px' }} /><td style={{ padding: '12px 16px' }} />
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{fmt(totalModal)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#6366f1' }}>{fmt(totalSales)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: totalLaba >= 0 ? '#16a34a' : '#dc2626' }}>
                        {totalLaba >= 0 ? '+' : '-'}{fmt(Math.abs(totalLaba))}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ background: totalLaba >= 0 ? '#f0fdf4' : '#fef2f2', color: totalLaba >= 0 ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                          {marginLaba.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>Catatan Penting</p>
              <p style={{ fontSize: 12, color: '#a16207', margin: 0, lineHeight: 1.7 }}>
                Laporan laba rugi dihitung berdasarkan <strong>harga beli</strong> yang diinput di halaman Produk.
                Pastikan harga beli sudah diisi dengan benar untuk hasil yang akurat.
                Produk tanpa harga beli akan dihitung modal = Rp 0.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ===== DIALOG CETAK STRUK ULANG ===== */}
      {selectedTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

            {/* Header dialog */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #ebebf5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Cetak Struk</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{selectedTx.invoice_number}</p>
              </div>
              <button
                onClick={function() { setSelectedTx(null) }}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} color="#6b7280" />
              </button>
            </div>

            {/* Preview struk */}
            <div style={{ padding: 16, background: '#eef2ff', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <ReceiptView transaction={selectedTx} />
              </div>
            </div>

            {/* Tombol aksi */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
              <button
                onClick={function() { setSelectedTx(null) }}
                style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}
              >
                Tutup
              </button>
              <button
                onClick={handleReprintReceipt}
                style={{ flex: 1, padding: '11px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Printer size={15} /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}