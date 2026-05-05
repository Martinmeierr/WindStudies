import { useState } from 'react'
import Login     from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import { Toast } from '@/components/ui/toast-provider'

const PASSWORD = '123456789'

export default function App() {
  const [auth,  setAuth]  = useState(() => sessionStorage.getItem('ws_auth') === '1')
  const [toast, setToast] = useState(null)

  function login(pwd) {
    if (pwd === PASSWORD) {
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
