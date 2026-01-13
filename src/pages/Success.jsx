import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function Success() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Get user from state or localStorage
    const stateUser = location.state?.user
    const stateToken = location.state?.token
    
    if (stateUser && stateToken) {
      setUser(stateUser)
      setToken(stateToken)
    } else {
      const storedUser = localStorage.getItem('auth_user')
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } else {
        navigate('/login')
      }
    }
  }, [location, navigate])

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="auth-layout">
      <motion.div 
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="logo">
          <img src="/inmapper.png" alt="Inmapper" />
        </div>

        <motion.div 
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          ✓
        </motion.div>

        <div className="heading">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Giriş Başarılı! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Hoş geldiniz, <strong>{user.name}</strong>
          </motion.p>
        </div>

        <motion.div 
          className="message message-success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '24px' }}
        >
          <span>✉️</span>
          <span>{user.email}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '24px' }}
        >
          <label 
            style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 500, 
              color: 'var(--text-secondary)', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Auth Token
          </label>
          <div 
            style={{ 
              display: 'flex', 
              gap: '8px',
              alignItems: 'stretch'
            }}
          >
            <input
              type="text"
              value={token?.slice(0, 40) + '...'}
              readOnly
              style={{
                flex: 1,
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              onClick={handleCopyToken}
              className="btn btn-secondary"
              style={{ 
                width: 'auto', 
                padding: '12px 16px',
                fontSize: '14px'
              }}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)', 
            marginTop: '8px' 
          }}>
            Bu token'ı diğer uygulamalarda kimlik doğrulaması için kullanabilirsiniz.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: '32px', display: 'flex', gap: '12px' }}
        >
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Dashboard →
          </button>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Çıkış Yap
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Success


