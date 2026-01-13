import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import Success from './pages/Success'
import Dashboard from './pages/Dashboard'

function App() {
  const [authState, setAuthState] = useState({
    email: null,
    pendingVerification: false,
    callbackUrl: null,
  })

  // Check for callback URL in query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const callback = params.get('callback') || params.get('redirect')
    if (callback) {
      setAuthState(prev => ({ ...prev, callbackUrl: callback }))
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="bg-pattern" />
      <div className="bg-grid" />
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={
            <Login 
              authState={authState} 
              setAuthState={setAuthState} 
            />
          } 
        />
        <Route 
          path="/register" 
          element={
            <Register 
              authState={authState} 
              setAuthState={setAuthState} 
            />
          } 
        />
        <Route 
          path="/verify" 
          element={
            authState.pendingVerification ? (
              <VerifyOTP 
                authState={authState} 
                setAuthState={setAuthState} 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/success" 
          element={<Success authState={authState} />} 
        />
        <Route 
          path="/dashboard" 
          element={<Dashboard />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

