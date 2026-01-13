import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import authApi from '../api/authApi'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await authApi.validateToken(token)
        if (response.valid) {
          setUser(response.user)
        } else {
          throw new Error('Invalid token')
        }
      } catch (error) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token')
    
    try {
      await authApi.logout(token)
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="auth-layout">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="auth-layout">
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: '500px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div className="logo" style={{ marginBottom: 0 }}>
            <img src="/inmapper.png" alt="Inmapper" style={{ height: 36 }} />
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '10px 16px', fontSize: '13px' }}
          >
            Çıkış Yap
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }} />
          <h2 style={{ 
            fontSize: '14px', 
            fontWeight: 500, 
            opacity: 0.8, 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Hoş Geldiniz
          </h2>
          <h3 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>
            {user.name}
          </h3>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>
            {user.email}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '16px',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: user.isVerified ? '#10b981' : '#f59e0b' 
            }} />
            {user.isVerified ? 'Doğrulanmış' : 'Doğrulama Bekliyor'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Hesap Bilgileri
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Kullanıcı ID</span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px',
                color: 'var(--accent-primary)'
              }}>
                {user.id?.slice(0, 8)}...
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>E-posta</span>
              <span style={{ fontSize: '14px' }}>{user.email}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Doğrulama</span>
              <span style={{ 
                fontSize: '14px',
                color: user.isVerified ? 'var(--success)' : 'var(--warning)'
              }}>
                {user.isVerified ? '✓ Doğrulandı' : '⏳ Bekliyor'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="message message-info"
          style={{ marginTop: '24px', marginBottom: 0 }}
        >
          <span>💡</span>
          <span style={{ fontSize: '13px' }}>
            Bu dashboard örnek bir sayfadır. Gerçek uygulamanızda token ile API'lere erişebilirsiniz.
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Dashboard


