# Component Integration Guide

This guide explains how all the new security, notification, and search components have been integrated into your existing pages.

## ✅ Integrated Components

### Dashboard Page (`src/app/dashboard/page.jsx`)

**Added Components:**
1. **GlobalSearchModal** - Global search functionality
2. **SuspiciousLoginAlert** - Alerts for suspicious login attempts
3. **PushPermissionPopup** - Requests push notification permission

**Added Features:**
- Search button in sidebar (opens GlobalSearchModal)
- Notification bell in chat header (opens NotificationCenter)
- Socket.io event handlers for:
  - `notification:new` - New notifications
  - `security:suspiciousLogin` - Suspicious login alerts
  - `message:newEncrypted` - Encrypted messages
  - `message:expired` - Expired messages
  - `message:deletedByPolicy` - Messages deleted by retention policy
- Socket authentication on connection
- User room joining for notifications

### DashboardLayout Component (`src/components/DashboardLayout/DashboardLayout.jsx`)

**Added Components:**
1. **NotificationBell** - Shows unread notification count
2. **NotificationCenter** - Full notifications panel
3. **ChatLockScreen** - Lock screen for locked chats

**Added Features:**
- Notification bell in chat header
- Chat lock status checking
- Chat lock screen display when chat is locked
- Automatic unlock handling

### Profile Page (`src/app/profile/page.jsx`)

**Added Components:**
1. **SecuritySettings** - Security preferences UI
2. **E2EEKeyManager** - End-to-end encryption key management
3. **TwoFactorModal** - Two-step verification setup

**Added Features:**
- Tabbed interface with three tabs:
  - **Profile** - Original profile settings
  - **Security** - Security settings and 2FA
  - **Encryption** - E2EE key management
- Security settings toggle switches
- 2FA enable/disable functionality
- E2EE key generation and management

### Sidebar Component (`src/components/Sidebar/Sidebar.jsx`)

**Added Features:**
- Search button in header (opens GlobalSearchModal)
- Header actions container for multiple buttons

## 🔌 Socket.io Integration

### Authentication
When a user connects, the socket automatically authenticates using the access token:
```javascript
socket.emit("authenticate", token);
socket.emit("user:join", userId);
```

### Event Handlers
All new security and notification events are handled:
- `notification:new` - Real-time notifications
- `security:suspiciousLogin` - Security alerts
- `message:newEncrypted` - Encrypted messages
- `message:expired` - Message expiration
- `message:deletedByPolicy` - Retention policy deletions

## 📱 Notification System

### NotificationBell
- Displays unread count badge
- Opens NotificationCenter on click
- Auto-updates every 30 seconds

### NotificationCenter
- Shows all notifications
- Mark as read functionality
- Delete notifications
- Real-time updates via Socket.io

### PushPermissionPopup
- Automatically shows on first visit
- Requests browser push notification permission
- Registers service worker
- Saves subscription to server

## 🔍 Search Integration

### GlobalSearchModal
- Accessible via search button in sidebar
- Also accessible via `window.openSearchModal()` function
- Includes:
  - Basic keyword search
  - Advanced filters panel
  - Saved searches
  - Search results display

## 🔒 Security Features

### Chat Lock
- Automatically checks lock status when chat is selected
- Shows ChatLockScreen if locked
- Handles unlock with PIN/password
- Stores decryption key in sessionStorage

### Security Settings
- Accessible in Profile page → Security tab
- Toggle switches for:
  - Screenshot blocking
  - Watermark messages
  - Disable copy/forward/download

### E2EE Key Management
- Accessible in Profile page → Encryption tab
- Generate RSA key pairs
- View public key
- Copy public key to clipboard

### Two-Step Verification
- Accessible in Profile page → Security tab
- Enable via modal
- Supports Email, SMS, and Authenticator app
- Backup codes generation

## 🎨 Styling

All components use CSS Modules:
- `DashboardLayout.module.css` - Updated with header actions
- `Sidebar.module.css` - Updated with search button
- `page.module.css` (profile) - Updated with tabs

## 🚀 Usage Examples

### Opening Search Modal
```javascript
// From anywhere in the app
window.openSearchModal();
```

### Checking Chat Lock Status
```javascript
const response = await fetch(`/api/security/lockChat?chatId=${chatId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
if (data.isLocked) {
  // Show lock screen
}
```

### Enabling 2FA
```javascript
// Opens TwoFactorModal
setShow2FAModal(true);
```

## 📝 Notes

1. **Service Worker**: Make sure `public/sw.js` is accessible for push notifications
2. **VAPID Keys**: Generate and add to `.env.local` for push notifications
3. **Socket Authentication**: Tokens are automatically sent on connection
4. **Chat Lock**: Lock status is checked automatically when selecting a chat
5. **Notifications**: Real-time updates via Socket.io, no polling needed

## 🔧 Configuration

### Environment Variables
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@ichat.com
```

### Service Worker
The service worker (`public/sw.js`) handles:
- Push notification display
- Notification click handling
- Notification close tracking

All components are now fully integrated and ready to use! 🎉

