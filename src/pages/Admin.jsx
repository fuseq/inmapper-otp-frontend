import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const token = localStorage.getItem('auth_token')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${API_URL}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()

      if (!data.valid || !data.user.isAdmin) {
        navigate('/dashboard')
        return
      }

      setUser(data.user)
      await Promise.all([fetchUsers(), fetchResources()])
    } catch (error) {
      console.error('Auth error:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/resources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setResources(data.resources || [])
    } catch (error) {
      console.error('Fetch resources error:', error)
    }
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
  }

  const handlePermissionToggle = async (resource) => {
    if (!selectedUser) return

    const currentPermissions = selectedUser.permissions || []
    const hasPermission = currentPermissions.some(p => p.resource === resource.id && p.canAccess)

    setSaving(true)
    try {
      const endpoint = hasPermission ? '/admin/permissions/revoke' : '/admin/permissions/grant'
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          resource: resource.id
        })
      })

      // Refresh user data
      await fetchUsers()
      const updatedUser = users.find(u => u.id === selectedUser.id)
      if (updatedUser) {
        // Refetch to get updated permissions
        const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setSelectedUser(data.user)
      }

      setMessage({ type: 'success', text: hasPermission ? 'Yetki kaldırıldı' : 'Yetki verildi' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Permission toggle error:', error)
      setMessage({ type: 'error', text: 'İşlem başarısız' })
      setTimeout(() => setMessage(null), 2000)
    } finally {
      setSaving(false)
      await fetchUsers()
    }
  }

  const handleAdminToggle = async (userId, currentIsAdmin) => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      })
      await fetchUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, isAdmin: !currentIsAdmin }))
      }
      setMessage({ type: 'success', text: currentIsAdmin ? 'Admin yetkisi kaldırıldı' : 'Admin yetkisi verildi' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Admin toggle error:', error)
      setMessage({ type: 'error', text: 'İşlem başarısız' })
      setTimeout(() => setMessage(null), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleActiveToggle = async (userId, currentIsActive) => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentIsActive })
      })
      await fetchUsers()
      setMessage({ type: 'success', text: currentIsActive ? 'Kullanıcı devre dışı bırakıldı' : 'Kullanıcı aktifleştirildi' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Active toggle error:', error)
      setMessage({ type: 'error', text: 'İşlem başarısız' })
      setTimeout(() => setMessage(null), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/inmapper.png" alt="Inmapper" style={{ height: 32 }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            Yetki Yönetimi
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {user?.name} (Admin)
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              borderRadius: 8,
              background: message.type === 'success' ? 'var(--success)' : 'var(--error)',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              zIndex: 1000
            }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Users List */}
        <div style={{
          width: 350,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          overflow: 'auto'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Kullanıcılar ({users.length})
            </h2>
          </div>
          <div>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => handleUserSelect(u)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  background: selectedUser?.id === u.id ? 'var(--bg-card)' : 'transparent',
                  borderLeft: selectedUser?.id === u.id ? '3px solid var(--accent-primary)' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>
                      {u.name}
                      {u.isAdmin && (
                        <span style={{
                          marginLeft: 8,
                          padding: '2px 6px',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.email}
                    </div>
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: u.isActive ? 'var(--success)' : 'var(--error)'
                  }} />
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {u.permissions?.filter(p => p.canAccess).map(p => (
                    <span key={p.id} style={{
                      padding: '2px 6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--accent-primary)',
                      borderRadius: 4,
                      fontSize: 10
                    }}>
                      {p.resource}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details & Permissions */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {selectedUser ? (
            <motion.div
              key={selectedUser.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* User Info Card */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {selectedUser.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selectedUser.email}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                      Kayıt: {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR')}
                      {selectedUser.lastLoginAt && (
                        <> · Son giriş: {new Date(selectedUser.lastLoginAt).toLocaleDateString('tr-TR')}</>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleActiveToggle(selectedUser.id, selectedUser.isActive)}
                      disabled={saving}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: selectedUser.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: selectedUser.isActive ? 'var(--error)' : 'var(--success)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {selectedUser.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                    </button>
                    <button
                      onClick={() => handleAdminToggle(selectedUser.id, selectedUser.isAdmin)}
                      disabled={saving || selectedUser.id === user?.id}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: selectedUser.isAdmin ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: selectedUser.isAdmin ? 'var(--warning)' : 'var(--accent-primary)',
                        cursor: selectedUser.id === user?.id ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        opacity: selectedUser.id === user?.id ? 0.5 : 1
                      }}
                    >
                      {selectedUser.isAdmin ? 'Admin Kaldır' : 'Admin Yap'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                padding: 24,
                border: '1px solid var(--border-subtle)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
                  Sayfa Erişim Yetkileri
                </h3>

                {selectedUser.isAdmin ? (
                  <div style={{
                    padding: 16,
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 12,
                    color: 'var(--accent-primary)',
                    fontSize: 14
                  }}>
                    ⚡ Admin kullanıcılar tüm sayfalara erişebilir
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {resources.map(resource => {
                      const hasAccess = selectedUser.permissions?.some(
                        p => p.resource === resource.id && p.canAccess
                      )
                      return (
                        <div
                          key={resource.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 16,
                            background: 'var(--bg-input)',
                            borderRadius: 12,
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>
                              {resource.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {resource.description}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                              {resource.url}
                            </div>
                          </div>
                          <button
                            onClick={() => handlePermissionToggle(resource)}
                            disabled={saving}
                            style={{
                              width: 56,
                              height: 32,
                              borderRadius: 16,
                              border: 'none',
                              background: hasAccess ? 'var(--success)' : 'var(--bg-secondary)',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s'
                            }}
                          >
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: 4,
                              left: hasAccess ? 28 : 4,
                              transition: 'left 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👈</div>
                <p>Yetki düzenlemek için bir kullanıcı seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

