import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './SupabaseClient'

var AuthContext = createContext(null)

export function AuthProvider(props) {
  var userState    = useState(null)
  var user         = userState[0]
  var setUser      = userState[1]

  var loadingState = useState(true)
  var loading      = loadingState[0]
  var setLoading   = loadingState[1]

  useEffect(function() {
    var saved = localStorage.getItem('pos_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch(e) {
        localStorage.removeItem('pos_user')
      }
    }
    setLoading(false)
  }, [])

  async function loginSuperAdmin(email, password) {
    var result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (result.error) {
      return { error: result.error.message }
    }

    var userData = {
      id:       result.data.user.id,
      username: email,
      nama:     'Super Admin',
      role:     'superadmin',
      type:     'supabase'
    }

    localStorage.setItem('pos_user', JSON.stringify(userData))
    setUser(userData)
    return { data: userData }
  }

  async function loginUser(username, password) {
    var result = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('aktif', true)
      .single()

    if (result.error || !result.data) {
      return { error: 'Username atau password salah!' }
    }

    var userData = {
      id:       result.data.id,
      username: result.data.username,
      nama:     result.data.nama,
      role:     result.data.role,
      type:     'manual'
    }

    localStorage.setItem('pos_user', JSON.stringify(userData))
    setUser(userData)
    return { data: userData }
  }

  async function logout() {
    var saved = localStorage.getItem('pos_user')
    if (saved) {
      try {
        var u = JSON.parse(saved)
        if (u.type === 'supabase') {
          await supabase.auth.signOut()
        }
      } catch(e) {}
    }
    localStorage.removeItem('pos_user')
    setUser(null)
  }

  var value = {
    user:            user,
    loading:         loading,
    loginSuperAdmin: loginSuperAdmin,
    loginUser:       loginUser,
    logout:          logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}