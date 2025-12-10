# User & Profile Module Documentation

## 📁 Folder Structure

```
ichat/
├── models/
│   ├── User.ts                    # User MongoDB model
│   └── Session.ts                 # Session/Token MongoDB model
├── lib/
│   ├── mongodb.ts                 # MongoDB connection utility
│   ├── utils.ts                   # Password hashing, JWT, OTP utilities
│   ├── email.ts                   # Email service (Nodemailer)
│   ├── sms.ts                     # SMS service (placeholder)
│   ├── totp.ts                    # TOTP/Authenticator app utilities
│   └── presence.ts                # Client-side presence management
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── request-otp/route.ts
│   │   │   │   ├── verify-otp/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   ├── verify-totp/route.ts
│   │   │   │   ├── setup-totp/route.ts
│   │   │   │   ├── enable-totp/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   └── [...nextauth]/route.ts  # NextAuth SSO
│   │   │   ├── user/
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── update-profile/route.ts
│   │   │   │   ├── update-status/route.ts
│   │   │   │   ├── update-theme/route.ts
│   │   │   │   ├── update-language/route.ts
│   │   │   │   └── update-privacy/route.ts
│   │   │   └── presence/
│   │   │       └── update/route.ts
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── profile/page.tsx
│   └── components/
│       ├── AvatarUploader/
│       ├── StatusBadge/
│       ├── ThemeSelector/
│       ├── LanguageSelector/
│       ├── ProfileCard/
│       └── ProtectedLayout/
└── middleware.ts                   # Auth middleware
```

## 🔐 Authentication

### Registration

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",  // Optional
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123",
  "rememberMe": false
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

### OTP Authentication

**Request OTP:**
- `POST /api/auth/request-otp`
- Body: `{ "email": "...", "type": "email" }` or `{ "phone": "...", "type": "sms" }`

**Verify OTP:**
- `POST /api/auth/verify-otp`
- Body: `{ "email": "...", "otp": "123456", "type": "email" }`

### Password Reset

**Request Reset:**
- `POST /api/auth/reset-password`
- Body: `{ "email": "...", "action": "request" }`

**Reset Password:**
- `POST /api/auth/reset-password`
- Body: `{ "resetToken": "...", "newPassword": "...", "action": "reset" }`

### Two-Factor Authentication (TOTP)

**Setup TOTP:**
- `POST /api/auth/setup-totp`
- Returns QR code URL and secret

**Enable TOTP:**
- `POST /api/auth/enable-totp`
- Body: `{ "totpToken": "123456" }`

**Verify TOTP:**
- `POST /api/auth/verify-totp`
- Body: `{ "totpToken": "123456" }`

### Social SSO (NextAuth)

**Providers:** Google, GitHub

**Setup:**
1. Add environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

2. Access via: `/api/auth/signin`

## 👤 Profile Management

### Get Current User

**Endpoint:** `GET /api/user/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

### Update Profile

**Endpoint:** `PATCH /api/user/update-profile`

**Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "designation": "Software Engineer",
  "profilePhoto": "base64_or_url"
}
```

### Update Status

**Endpoint:** `PATCH /api/user/update-status`

**Body:**
```json
{
  "presenceStatus": "online",  // online | offline | away | do-not-disturb
  "statusMessage": "Busy"
}
```

### Update Theme

**Endpoint:** `PATCH /api/user/update-theme`

**Body:**
```json
{
  "theme": "dark",  // light | dark | custom
  "customTheme": "...",
  "chatWallpaper": "..."
}
```

### Update Language

**Endpoint:** `PATCH /api/user/update-language`

**Body:**
```json
{
  "language": "en"
}
```

### Update Privacy Settings

**Endpoint:** `PATCH /api/user/update-privacy`

**Body:**
```json
{
  "privacySettings": {
    "showProfilePhoto": true,
    "showLastSeen": true,
    "showStatus": true,
    "showDesignation": true
  }
}
```

## 🟢 Presence System

### Update Presence

**Endpoint:** `POST /api/presence/update`

**Body:**
```json
{
  "presenceStatus": "online"
}
```

### Client-Side Presence

The presence system automatically:
- Sets user to "online" on page load
- Tracks user activity (mouse, keyboard, scroll, touch)
- Sets user to "away" after 5 minutes of inactivity
- Sets user to "offline" on page unload

**Usage:**
```typescript
import { initializePresence, cleanupPresence } from '@/lib/presence';

// In your component
useEffect(() => {
  initializePresence();
  return () => cleanupPresence();
}, []);
```

## 🎨 Components

### AvatarUploader

Upload and preview profile photos.

```tsx
<AvatarUploader
  currentPhoto={user.profilePhoto}
  onUpload={handleUpload}
  size="large"
/>
```

### StatusBadge

Display user presence status.

```tsx
<StatusBadge
  status="online"
  size="medium"
  showLabel
/>
```

### ThemeSelector

Select app theme.

```tsx
<ThemeSelector
  currentTheme="dark"
  onThemeChange={handleThemeChange}
/>
```

### LanguageSelector

Select app language.

```tsx
<LanguageSelector
  currentLanguage="en"
  onLanguageChange={handleLanguageChange}
/>
```

### ProfileCard

Display user profile information.

```tsx
<ProfileCard
  user={user}
  showActions
  onEdit={handleEdit}
/>
```

### ProtectedLayout

Protect routes requiring authentication.

```tsx
<ProtectedLayout>
  <YourProtectedContent />
</ProtectedLayout>
```

## 🔒 Middleware Protection

The middleware (`middleware.ts`) automatically:
- Redirects unauthenticated users to `/auth/login`
- Redirects authenticated users away from auth pages
- Protects all routes except public ones

**Public Routes:**
- `/`
- `/auth/login`
- `/auth/register`
- `/auth/reset-password`

## 📊 Database Models

### User Model

```typescript
{
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  profilePhoto?: string;
  designation?: string;
  statusMessage?: string;
  presenceStatus: 'online' | 'offline' | 'away' | 'do-not-disturb';
  lastSeen: Date;
  theme: 'light' | 'dark' | 'custom';
  customTheme?: string;
  chatWallpaper?: string;
  language: string;
  privacySettings: {
    showProfilePhoto: boolean;
    showLastSeen: boolean;
    showStatus: boolean;
    showDesignation: boolean;
  };
  twoFactorEnabled: boolean;
  twoFactorType?: 'sms' | 'email' | 'authenticator';
  otpSecret?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Model

```typescript
{
  userId: ObjectId;
  token: string;
  type: 'jwt' | 'refresh' | 'otp' | 'reset';
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ichat

# JWT Secrets
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# SMS (Optional - configure your provider)
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
SMS_FROM_NUMBER=+1234567890

# NextAuth SSO
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📝 Example Data Flow

### Registration → Login → Update Profile → Presence

1. **Register:**
   ```bash
   POST /api/auth/register
   Body: { name, email, password }
   ```

2. **Login:**
   ```bash
   POST /api/auth/login
   Body: { email, password }
   Response: { accessToken, refreshToken, user }
   ```

3. **Update Profile:**
   ```bash
   PATCH /api/user/update-profile
   Headers: { Authorization: Bearer <token> }
   Body: { designation, phone }
   ```

4. **Update Presence:**
   ```bash
   POST /api/presence/update
   Headers: { Authorization: Bearer <token> }
   Body: { presenceStatus: "online" }
   ```

## 🔗 Integration with Future Chat Features

The User & Profile module is designed to integrate seamlessly with future chat features:

1. **User IDs:** All users have unique `_id` fields that can be referenced in chat messages, conversations, etc.

2. **Presence Status:** Real-time presence updates can be used to show online/offline status in chat lists.

3. **Profile Data:** User profiles (name, photo, designation) can be displayed in chat headers and message bubbles.

4. **Privacy Settings:** Privacy settings control what information is visible to other users in chats.

5. **Themes:** User themes can be applied to the entire chat interface.

6. **Language:** User language preference can be used for chat translations and UI localization.

## 🚀 Next Steps

1. **Configure Email Service:** Set up Nodemailer with your email provider
2. **Configure SMS Service:** Integrate with Twilio, AWS SNS, or your preferred SMS provider
3. **Set up SSO:** Configure Google and GitHub OAuth apps
4. **Add File Storage:** Integrate with AWS S3, Cloudinary, or similar for profile photos
5. **Implement Realtime:** Add WebSocket/Server-Sent Events for real-time presence updates
6. **Add Redis:** Use Redis for faster presence tracking and session management

## 📚 Additional Notes

- All passwords are hashed using bcryptjs with salt rounds of 12
- JWT tokens expire after 15 minutes (access) and 7 days (refresh)
- OTP codes expire after 10 minutes
- Password reset tokens expire after 1 hour
- Presence automatically updates based on user activity
- All API routes include proper error handling and validation

