# Quick Start Guide - User & Profile Module

## 🚀 Setup Steps

### 1. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret for JWT (min 32 characters)
- `JWT_REFRESH_SECRET` - Random secret for refresh tokens (min 32 characters)

**Optional (for full functionality):**
- Email configuration (for OTP and password reset emails)
- SMS configuration (for SMS OTP)
- Google/GitHub OAuth credentials (for SSO)

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Landing Page:** http://localhost:3000
- **Login:** http://localhost:3000/auth/login
- **Register:** http://localhost:3000/auth/register
- **Dashboard:** http://localhost:3000/dashboard (requires login)
- **Profile:** http://localhost:3000/profile (requires login)

## 📝 Testing the Module

### 1. Register a New User

1. Go to `/auth/register`
2. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123 (min 8 chars)
3. Click "Create Account"
4. You'll be redirected to dashboard

### 2. Login

1. Go to `/auth/login`
2. Enter email and password
3. Click "Sign In"
4. You'll be redirected to dashboard

### 3. Update Profile

1. Go to `/profile` or click "Profile Settings" from dashboard
2. Update:
   - Profile photo (click avatar to upload)
   - Name, phone, designation
   - Presence status
   - Status message
   - Theme and language
   - Privacy settings
3. Click "Save Changes"

### 4. Test Presence System

1. Open dashboard
2. Presence automatically sets to "online"
3. Leave page idle for 5+ minutes → status changes to "away"
4. Close tab → status changes to "offline"

## 🔧 API Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl http://localhost:3000/api/user/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/user/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Updated Name",
    "designation": "Senior Developer"
  }'
```

### Update Presence
```bash
curl -X POST http://localhost:3000/api/presence/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "presenceStatus": "online"
  }'
```

## 🎯 Key Features Implemented

✅ **Authentication**
- Email/Password registration and login
- JWT-based authentication
- Password reset via email
- OTP verification (Email/SMS)
- Two-factor authentication (TOTP/Authenticator app)
- Social SSO (Google, GitHub) via NextAuth

✅ **User Profile**
- Profile photo upload
- Name, email, phone, designation
- Custom status message
- Presence status (online/offline/away/do-not-disturb)
- Last seen timestamp

✅ **Themes & Personalization**
- Light/Dark/Custom theme selection
- Chat wallpaper selection
- Multi-language support

✅ **Privacy Settings**
- Control visibility of profile photo
- Control visibility of last seen
- Control visibility of status message
- Control visibility of designation

✅ **Presence System**
- Real-time presence tracking
- Automatic away detection (5 min inactivity)
- Last seen updates
- Status synchronization

## 🔐 Security Features

- Password hashing with bcryptjs (12 salt rounds)
- JWT token expiration (15 min access, 7 days refresh)
- Secure session management
- Token refresh mechanism
- OTP expiration (10 minutes)
- Password reset token expiration (1 hour)
- Protected API routes
- Middleware-based route protection

## 📚 Next Steps

1. **Configure Email Service:**
   - Set up Gmail App Password or use SMTP service
   - Test email sending with password reset

2. **Configure SMS Service:**
   - Integrate Twilio, AWS SNS, or MessageBird
   - Test SMS OTP functionality

3. **Set up SSO:**
   - Create Google OAuth app
   - Create GitHub OAuth app
   - Test social login

4. **Add File Storage:**
   - Integrate AWS S3, Cloudinary, or similar
   - Update avatar upload to use storage service

5. **Implement Realtime:**
   - Add WebSocket/Server-Sent Events
   - Real-time presence updates across clients

6. **Add Redis (Optional):**
   - Faster presence tracking
   - Session caching
   - Rate limiting

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check `MONGODB_URI` in `.env.local`
- Ensure MongoDB is running
- Check network connectivity

### JWT Errors
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Use strong, random secrets (min 32 characters)

### Email Not Sending
- Check email credentials in `.env.local`
- For Gmail, use App Password (not regular password)
- Check spam folder

### Presence Not Updating
- Check browser console for errors
- Ensure user is logged in
- Verify API endpoint is accessible

## 📖 Documentation

For detailed documentation, see:
- `USER_PROFILE_MODULE.md` - Complete module documentation
- API routes documentation in code comments
- Component documentation in component files

