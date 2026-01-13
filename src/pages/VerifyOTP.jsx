import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import authApi from '../api/authApi'

function VerifyOTP({ authState, setAuthState }) {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every(digit => digit)) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)
        if (digits.length === 6) {
          handleVerify(newOtp.join(''))
        }
      })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const digits = text.replace(/\D/g, '').slice(0, 6).split('')
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    if (digits.length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleVerify = async (code) => {
    if (code.length !== 6) return
    
    setLoading(true)
    setError('')

    try {
      const response = await authApi.verifyOTP(authState.email, code, authState.callbackUrl)
      
      // Store token
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      
      // Navigate to success or callback
      if (authState.callbackUrl) {
        // Redirect to callback with token
        const callbackUrl = new URL(authState.callbackUrl)
        callbackUrl.searchParams.set('token', response.token)
        window.location.href = callbackUrl.toString()
      } else {
        navigate('/success', { 
          state: { 
            user: response.user,
            token: response.token 
          } 
        })
      }
    } catch (err) {
      setError(err.error || 'Doğrulama başarısız')
      // Shake animation trigger
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setCanResend(false)
    setResendTimer(60)
    setError('')

    try {
      await authApi.resendOTP(authState.email)
    } catch (err) {
      setError(err.error || 'Kod gönderilemedi')
    }
  }

  const maskedEmail = authState.email?.replace(
    /(.{2})(.*)(@.*)/,
    (_, start, middle, end) => start + '*'.repeat(Math.min(middle.length, 5)) + end
  )

  return (
    <div className="auth-layout">
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="logo">
          <div className="logo-icon">📧</div>
          <span className="logo-text">OTP Auth</span>
        </div>

        <div className="heading">
          <h1>Doğrulama Kodu</h1>
          <p>
            <strong>{maskedEmail}</strong> adresine gönderilen 6 haneli kodu girin
          </p>
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

        <form className="form" onSubmit={(e) => { e.preventDefault(); handleVerify(otp.join('')) }}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                disabled={loading}
                autoFocus={index === 0}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              />
            ))}
          </div>

          <motion.button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || otp.some(d => !d)}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>Doğrula</span>
                <span>✓</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="resend-section">
          {canResend ? (
            <button 
              className="btn btn-text" 
              onClick={handleResend}
              type="button"
            >
              Kodu Tekrar Gönder
            </button>
          ) : (
            <p className="resend-text">
              Kodu tekrar göndermek için <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{resendTimer}s</span> bekleyin
            </p>
          )}
        </div>

        <div className="auth-footer" style={{ marginTop: '16px' }}>
          <button 
            className="btn btn-text" 
            onClick={() => {
              setAuthState(prev => ({ ...prev, pendingVerification: false }))
              navigate('/login')
            }}
            type="button"
          >
            ← E-posta adresini değiştir
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyOTP

