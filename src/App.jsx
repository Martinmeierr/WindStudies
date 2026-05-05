import { useState } from 'react'
import Login     from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import { Toast } from '@/components/ui/toast-provider'

const PASSWORD_HASH = '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225'

async function hashPassword(pwd) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function App() {
  const [auth,  setAuth]  = useState(() => sessionStorage.getItem('ws_auth') === '1')
  const [toast, setToast] = useState(null)

  async function login(pwd) {
    const hash = await hashPassword(pwd)
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem('ws_auth', '1')
      setAuth(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('ws_auth')
    setAuth(false)
  }

  function showToast(message, type = 'success') {
    setToast({ message, type, id: Date.now() })
  }

  return (
    <div className="dark">
      {auth
        ? <Dashboard logout={logout} showToast={showToast} />
        : <Login onLogin={login} />
      }
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
