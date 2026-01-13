import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import authApi from '../api/authApi'

function Login({ authState, setAuthState }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.login(email, authState.callbackUrl)
      
      setAuthState(prev => ({
        ...prev,
        email,
        pendingVerification: true,
      }))
      
      navigate('/verify')
    } catch (err) {
      setError(err.message || err.error || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="logo">
          <div className="logo-icon">🔐</div>
          <span className="logo-text">OTP Auth</span>
        </div>

        <div className="heading">
          <h1>Hoş Geldiniz</h1>
          <p>E-posta adresinizi girerek giriş yapın</p>
        </div>

        {error && (
          <motion.div 
            className="message message-error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-posta Adresi</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <motion.button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !email}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <span>Doğrulama Kodu Gönder</span>
                <span>→</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="divider">veya</div>

        <div className="auth-footer">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="link">
            Kayıt Olun
          </Link>
        </div>

        {authState.callbackUrl && (
          <motion.div 
            className="message message-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: '20px', marginBottom: 0 }}
          >
            <span>ℹ️</span>
            <span style={{ fontSize: '12px' }}>
              Giriş sonrası yönlendirileceksiniz
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Login

