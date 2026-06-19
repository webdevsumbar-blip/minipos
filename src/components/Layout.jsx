import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef2ff' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: '#eef2ff' }}>
        <Outlet />
      </main>
    </div>
  )
}