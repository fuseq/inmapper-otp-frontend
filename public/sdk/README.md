# Inmapper Auth SDK

Web uygulamalarınız için tek satırda OTP doğrulama entegrasyonu.

## 🚀 Hızlı Başlangıç

### Vanilla JavaScript

```html
<script src="https://inmapper-otp.netlify.app/sdk/inmapper-auth.js"></script>
<script>
  const auth = new InmapperAuth();
  
  // Sayfayı koru - giriş yapmamış kullanıcıyı login'e yönlendir
  auth.protect().then(user => {
    if (user) {
      console.log('Hoş geldin', user.name);
    }
  });
</script>
```

### ES Module

```javascript
import { InmapperAuth } from 'https://inmapper-otp.netlify.app/sdk/inmapper-auth.esm.js';

const auth = new InmapperAuth();
const user = await auth.protect();
```

### React / Next.js

```jsx
import { InmapperAuthProvider, useInmapperAuth } from './useInmapperAuth';

// App.jsx
function App() {
  return (
    <InmapperAuthProvider protect={true}>
      <Dashboard />
    </InmapperAuthProvider>
  );
}

// Dashboard.jsx
function Dashboard() {
  const { user, loading, logout } = useInmapperAuth();
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div>
      <h1>Merhaba {user.name}!</h1>
      <button onClick={() => logout(true)}>Çıkış</button>
    </div>
  );
}
```

## 📖 API Referansı

### `new InmapperAuth(config?)`

Yeni bir auth instance oluşturur.

```javascript
const auth = new InmapperAuth({
  apiUrl: 'https://inmapper-otp-api.isohtel.com.tr/api',  // Backend URL
  loginUrl: 'https://inmapper-otp.netlify.app/login',     // Login sayfası
  tokenKey: 'inmapper_auth_token',                         // localStorage key
  autoRedirect: true,                                      // Otomatik yönlendirme
});
```

### Metodlar

| Metod | Açıklama |
|-------|----------|
| `protect()` | Sayfayı korur. Giriş yapılmamışsa login'e yönlendirir. `Promise<User\|null>` döner. |
| `isAuthenticated()` | Kullanıcı giriş yapmış mı? `Promise<boolean>` döner. |
| `getUser(forceRefresh?)` | Kullanıcı bilgilerini getirir. `Promise<User\|null>` döner. |
| `getToken()` | Mevcut token'ı döner. |
| `login(callbackUrl?)` | Login sayfasına yönlendirir. |
| `logout(redirect?)` | Çıkış yapar. `redirect=true` ise login'e yönlendirir. |
| `fetch(url, options)` | Authorization header'lı fetch yapar. |

### User Objesi

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}
```

## 🔧 Yapılandırma

### Backend'e Sitenizi Ekleyin

CapRover'da `ALLOWED_CALLBACK_URLS` environment variable'ına sitenizi ekleyin:

```
ALLOWED_CALLBACK_URLS=https://site1.com,https://site2.com,https://admin.example.com
```

## 📁 Dosyalar

```
/sdk/
├── inmapper-auth.js      # Vanilla JS (UMD)
├── inmapper-auth.esm.js  # ES Module
├── react/
│   └── useInmapperAuth.js # React Hook & Provider
└── examples/
    ├── vanilla.html       # HTML örneği
    └── react-example.jsx  # React örneği
```

## 🔒 Güvenlik

- Token'lar localStorage'da saklanır
- Her istek backend'de doğrulanır
- HTTPS zorunludur
- CORS ile izin verilen domainler kontrol edilir


