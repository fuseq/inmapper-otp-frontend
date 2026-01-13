import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import authApi from '../api/authApi'

function Register({ authState, setAuthState }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.register(formData.email, formData.name, authState.callbackUrl)
      
      setAuthState(prev => ({
        ...prev,
        email: formData.email,
        pendingVerification: true,
      }))
      
      navigate('/verify')
    } catch (err) {
      if (err.error === 'User already exists') {
        setError('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.')
      } else {
        setError(err.message || err.error || 'Kayıt başarısız')
      }
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
          <h1>Kayıt Olun</h1>
          <p>Yeni hesap oluşturmak için bilgilerinizi girin</p>
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
            <label htmlFor="name">İsim</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Adınız Soyadınız"
              required
              autoComplete="name"
              disabled={loading}
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-posta Adresi</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <motion.button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.email || !formData.name}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <span>Kayıt Ol</span>
                <span>→</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="divider">veya</div>

        <div className="auth-footer">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="link">
            Giriş Yapın
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Register

