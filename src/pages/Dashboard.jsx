import { useState, useEffect } from 'react'
import { supabase } from '../SupabaseClient'
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, Receipt, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(n) { return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID') }

function startOfDay(d) { var x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d)   { var x = new Date(d); x.setHours(23,59,59,999); return x }

function formatTime(str) {
  var d  = new Date(str)
  var dd = String(d.getDate()).padStart(2,'0')
  var mm = String(d.getMonth()+1).padStart(2,'0')
  var hh = String(d.getHours()).padStart(2,'0')
  var mi = String(d.getMinutes()).padStart(2,'0')
  return dd+'/'+mm+' '+hh+':'+mi
}

function formatDay(str) {
  var days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
  var d = new Date(str)
  return days[d.getDay()]
}

var PAYMENT_COLORS = { Tunai: '#6366f1', QRIS: '#22c55e', Debit: '#f97316', Transfer: '#3b82f6' }

function StatCard(props) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>{props.label}</p>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: props.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {props.icon}
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>{props.value}</p>
      {props.change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {props.change >= 0
            ? <ArrowUp size={12} color="#16a34a" />
            : <ArrowDown size={12} color="#dc2626" />
          }
          <span style={{ fontSize: 12, color: props.change >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            {Math.abs(props.change)}% vs kemarin
          </span>
        </div>
      )}
      {props.sub && (
        <p style={{ fontSize: 12, color: props.subColor || '#9ca3af', margin: 0, fontWeight: 500 }}>{props.sub}</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  var statsState   = useState(null)
  var stats        = statsState[0]
  var setStats     = statsState[1]

  var recentState  = useState([])
  var recentTx     = recentState[0]
  var setRecentTx  = recentState[1]

  var chartState   = useState([])
  var chartData    = chartState[0]
  var setChartData = chartState[1]

  var lowState     = useState([])
  var lowStock     = lowState[0]
  var setLowStock  = lowState[1]

  var topState     = useState([])
  var topProducts  = topState[0]
  var setTopProducts = topState[1]

  var loadingState = useState(true)
  var loading      = loadingState[0]
  var setLoading   = loadingState[1]

  var timeState    = useState('')
  var currentTime  = timeState[0]
  var setCurrentTime = timeState[1]

  useEffect(function() {
    function tick() {
      var now = new Date()
      var hh  = String(now.getHours()).padStart(2,'0')
      var mi  = String(now.getMinutes()).padStart(2,'0')
      var ss  = String(now.getSeconds()).padStart(2,'0')
      var days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
      var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
      setCurrentTime(days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear() + ' · ' + hh + ':' + mi + ':' + ss)
    }
    tick()
    var timer = setInterval(tick, 1000)
    return function() { clearInterval(timer) }
  }, [])

  useEffect(function() {
    async function load() {
      var now       = new Date()
      var todayStart = startOfDay(now)
      var todayEnd   = endOfDay(now)
      var yesterday  = new Date(now); yesterday.setDate(yesterday.getDate()-1)
      var yStart     = startOfDay(yesterday)
      var yEnd       = endOfDay(yesterday)

      var txRes  = await supabase.from('transactions').select('*').eq('status','completed').order('created_at',{ascending:false}).limit(500)
      var prodRes = await supabase.from('products').select('*')

      var allTx   = txRes.data   || []
      var allProd = prodRes.data || []

      var todayTx = allTx.filter(function(t) {
        var d = new Date(t.created_at)
        return d >= todayStart && d <= todayEnd
      })

      var yesterdayTx = allTx.filter(function(t) {
        var d = new Date(t.created_at)
        return d >= yStart && d <= yEnd
      })

      var todaySales     = todayTx.reduce(function(s,t) { return s+(t.total||0) }, 0)
      var yesterdaySales = yesterdayTx.reduce(function(s,t) { return s+(t.total||0) }, 0)
      var salesChange    = yesterdaySales > 0 ? Math.round(((todaySales-yesterdaySales)/yesterdaySales)*100) : 0
      var txChange       = yesterdayTx.length > 0 ? Math.round(((todayTx.length-yesterdayTx.length)/yesterdayTx.length)*100) : 0

      var low = allProd.filter(function(p) { return p.stock <= (p.min_stock||5) })
      setLowStock(low)

      // Grafik 7 hari
      var chart = []
      for (var i = 6; i >= 0; i--) {
        var day    = new Date(now); day.setDate(day.getDate()-i)
        var dStart = startOfDay(day)
        var dEnd   = endOfDay(day)
        var dayTx  = allTx.filter(function(t) {
          var d = new Date(t.created_at)
          return d >= dStart && d <= dEnd
        })
        var dayTotal = dayTx.reduce(function(s,t) { return s+(t.total||0) }, 0)
        chart.push({ date: formatDay(day.toISOString()), total: dayTotal, count: dayTx.length })
      }
      setChartData(chart)

      // Top produk hari ini
      var prodMap = {}
      todayTx.forEach(function(t) {
        var items = t.items || []
        items.forEach(function(item) {
          if (!prodMap[item.product_name]) prodMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
          prodMap[item.product_name].qty     += item.qty
          prodMap[item.product_name].revenue += item.subtotal
        })
      })
      var top = Object.values(prodMap).sort(function(a,b) { return b.qty-a.qty }).slice(0,5)
      setTopProducts(top)

      // Metode bayar hari ini
      var payMap = {}
      todayTx.forEach(function(t) {
        var m = t.payment_method || 'Lainnya'
        payMap[m] = (payMap[m]||0) + (t.total||0)
      })

      setStats({
        todaySales:   todaySales,
        todayTx:      todayTx.length,
        totalProducts: allProd.length,
        lowStockCount: low.length,
        salesChange:   salesChange,
        txChange:      txChange,
        payMap:        payMap,
        totalAllSales: allTx.reduce(function(s,t) { return s+(t.total||0) }, 0),
      })

      setRecentTx(allTx.slice(0,10))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #ede9fe', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#9ca3af' }}>Memuat dashboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, background: '#f4f4f8', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Selamat datang kembali! Berikut ringkasan bisnis kamu.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #ebebf5', borderRadius: 10, padding: '8px 14px' }}>
          <Clock size={14} color="#6366f1" />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{currentTime}</span>
        </div>
      </div>

      {/* Alert Stok Rendah */}
      {lowStock.length > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#ca8a04" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
              {lowStock.length} produk perlu restock!
            </p>
            <p style={{ fontSize: 12, color: '#a16207', margin: '2px 0 0' }}>
              {lowStock.map(function(p) { return p.name + ' (' + p.stock + ')' }).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          label="Penjualan Hari Ini"
          value={fmt(stats.todaySales)}
          bg="#eef2ff"
          icon={<DollarSign size={20} color="#6366f1" />}
          change={stats.salesChange}
        />
        <StatCard
          label="Transaksi Hari Ini"
          value={stats.todayTx}
          bg="#f0fdf4"
          icon={<Receipt size={20} color="#16a34a" />}
          change={stats.txChange}
        />
        <StatCard
          label="Total Produk"
          value={stats.totalProducts}
          bg="#fef9c3"
          icon={<Package size={20} color="#ca8a04" />}
          sub="produk terdaftar"
        />
        <StatCard
          label="Stok Rendah"
          value={stats.lowStockCount}
          bg={stats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4'}
          icon={<AlertTriangle size={20} color={stats.lowStockCount > 0 ? '#dc2626' : '#16a34a'} />}
          sub={stats.lowStockCount > 0 ? 'perlu restock' : 'semua aman'}
          subColor={stats.lowStockCount > 0 ? '#dc2626' : '#16a34a'}
        />
      </div>

      {/* Grafik + Metode Bayar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {/* Grafik 7 Hari */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Penjualan 7 Hari Terakhir</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Total pendapatan per hari</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={function(v) { return (v/1000).toFixed(0)+'k' }} />
              <Tooltip
                formatter={function(v) { return [fmt(v), 'Penjualan'] }}
                contentStyle={{ borderRadius: 10, border: '1px solid #ebebf5', fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metode Pembayaran */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>Pembayaran Hari Ini</h2>
          {Object.keys(stats.payMap).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
              <p style={{ fontSize: 13 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(stats.payMap).sort(function(a,b) { return b[1]-a[1] }).map(function(entry) {
                var method = entry[0]
                var amount = entry[1]
                var total  = stats.todaySales
                var pct    = total > 0 ? (amount/total)*100 : 0
                var color  = PAYMENT_COLORS[method] || '#9ca3af'
                return (
                  <div key={method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{method}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#111827', margin: 0 }}>{fmt(amount)}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{pct.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct+'%', background: color, borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Top Produk + Transaksi Terbaru */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>

        {/* Top Produk Hari Ini */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>Top Produk Hari Ini</h2>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
              <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
              <p style={{ fontSize: 13 }}>Belum ada penjualan</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map(function(p, i) {
                return (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? '#eef2ff' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i === 0 ? '#6366f1' : '#9ca3af', flexShrink: 0 }}>
                      {i+1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p.qty} terjual</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>{fmt(p.revenue)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Transaksi Terbaru */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #ebebf5', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Transaksi Terbaru</h2>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>10 terakhir</span>
          </div>
          {recentTx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <p style={{ fontSize: 14 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9ff' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Invoice</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Waktu</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Kasir</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Bayar</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map(function(tx) {
                  var color = PAYMENT_COLORS[tx.payment_method] || '#9ca3af'
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{tx.invoice_number}</td>
                      <td style={{ padding: '11px 16px', color: '#6b7280', fontSize: 12 }}>{formatTime(tx.created_at)}</td>
                      <td style={{ padding: '11px 16px', color: '#374151', fontSize: 12 }}>{tx.cashier_name || '-'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: color+'18', color: color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                          {tx.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>{fmt(tx.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  )
}