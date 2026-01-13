/**
 * React/Next.js Kullanım Örneği
 * 
 * 1. SDK'yı projenize kopyalayın veya CDN'den import edin
 * 2. App.jsx'i InmapperAuthProvider ile sarın
 * 3. Korumalı sayfalarda useInmapperAuth hook'unu kullanın
 */

// ============================================
// Yöntem 1: Provider ile (Önerilen)
// ============================================

// App.jsx
import React from 'react';
import { InmapperAuthProvider } from './useInmapperAuth';
import Dashboard from './Dashboard';

function App() {
  return (
    <InmapperAuthProvider protect={true}>
      <Dashboard />
    </InmapperAuthProvider>
  );
}

// Dashboard.jsx
import React from 'react';
import { useInmapperAuth } from './useInmapperAuth';

function Dashboard() {
  const { user, loading, logout } = useInmapperAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <h1>Hoş Geldin, {user?.name}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={() => logout(true)}>Çıkış Yap</button>
    </div>
  );
}


// ============================================
// Yöntem 2: Class ile (Basit kullanım)
// ============================================

import React, { useEffect, useState } from 'react';
import { InmapperAuth } from 'https://inmapper-otp.netlify.app/sdk/inmapper-auth.esm.js';

const auth = new InmapperAuth();

function ProtectedPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await auth.protect();
      setUser(currentUser);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (!user) return null; // Yönlendirme yapılıyor

  return (
    <div>
      <h1>Merhaba {user.name}!</h1>
      <button onClick={() => auth.logout(true)}>Çıkış</button>
    </div>
  );
}


// ============================================
// Next.js Middleware Örneği
// ============================================

// middleware.js (Next.js 13+)
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token = request.cookies.get('inmapper_auth_token')?.value;
  
  // Korumalı rotalar
  const protectedPaths = ['/dashboard', '/admin', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('https://inmapper-otp.netlify.app/login');
    loginUrl.searchParams.set('callback', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token'ı doğrula
  try {
    const response = await fetch('https://inmapper-otp-api.isohtel.com.tr/api/auth/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!data.valid) {
      const loginUrl = new URL('https://inmapper-otp.netlify.app/login');
      loginUrl.searchParams.set('callback', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Auth validation error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/settings/:path*'],
};


