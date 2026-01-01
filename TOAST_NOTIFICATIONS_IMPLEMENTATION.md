# Real-Time Toast Notifications with Sound - Implementation Guide

## Overview

This implementation provides real-time toast notifications with sound alerts for new messages in the chat application. Notifications appear instantly across all devices and browsers without requiring a page refresh.

## Architecture

### Components

1. **ToastNotification** (`src/components/ToastNotification/ToastNotification.jsx`)

   - Individual toast component with animations
   - Supports different notification types (message, mention, reply, etc.)
   - Clickable to navigate to relevant chat/group

2. **ToastContainer** (`src/components/ToastContainer/ToastContainer.jsx`)

   - Container that manages multiple toasts
   - Handles sound playback for new notifications
   - Positioned at top-right of screen

3. **ToastContext** (`src/contexts/ToastContext.jsx`)

   - Global state management for toasts
   - Provides `addToast`, `removeToast`, and `clearAllToasts` functions

4. **useToastNotifications** (`src/hooks/useToastNotifications.js`)
   - React hook that listens to Socket.io events
   - Automatically creates toasts for new messages and notifications
   - Handles navigation when toast is clicked

### Flow

```
New Message Sent
    ↓
Server: POST /api/messages/send
    ↓
Server: Creates notification via notifyNewMessage()
    ↓
Server: Emits Socket.io events:
    - 'message:new' to chat room and user rooms
    - 'notification:new' to user rooms
    ↓
Client: useToastNotifications hook listens to events
    ↓
Client: Creates toast via ToastContext
    ↓
Client: ToastContainer displays toast with sound
```

## Features

### ✅ Real-Time Delivery

- Uses Socket.io for instant message delivery
- Works across all devices and browsers
- No page refresh required

### ✅ Sound Alerts

- Plays notification sound when toast appears
- Falls back to Web Audio API beep if sound file not found
- Sound can be disabled per toast

### ✅ Smart Display Logic

- Doesn't show toast if user is viewing the same chat
- Respects page visibility (can be enhanced to show even when page is visible)
- Different toast styles for different notification types

### ✅ User Experience

- Smooth animations (slide in from right, fade out)
- Clickable to navigate to relevant chat
- Auto-dismisses after 5 seconds (configurable)
- Manual dismiss with close button
- Mobile responsive

## Setup Instructions

### 1. Add Notification Sound (Optional)

Place a notification sound file at:

```
public/sounds/notification.mp3
```

Recommended:

- Format: MP3, WAV, or OGG
- Duration: 0.3-0.5 seconds
- Volume: Moderate (not too loud)

If no sound file is provided, the system will use a Web Audio API beep as fallback.

### 2. Integration

The toast system is already integrated into:

- `src/components/AppLayout/AppLayout.jsx` - Wraps app with ToastProvider
- `src/app/chats/page.jsx` - Uses useToastNotifications hook
- `src/app/api/messages/send/route.js` - Sends notifications when messages are sent

### 3. Usage

#### Basic Usage (Already Integrated)

The system automatically shows toasts for:

- New messages
- Mentions
- Replies
- File uploads
- Group invites
- Other notifications

#### Manual Toast Creation

If you need to create a toast manually:

```jsx
import { useToast } from "../contexts/ToastContext";

function MyComponent() {
  const { addToast } = useToast();

  const showCustomToast = () => {
    addToast({
      type: "message",
      title: "Custom Notification",
      body: "This is a custom toast notification",
      duration: 5000,
      playSound: true,
      onClick: () => {
        // Navigate or perform action
        router.push("/chats");
      },
    });
  };

  return <button onClick={showCustomToast}>Show Toast</button>;
}
```

## Configuration

### Toast Duration

Default: 5000ms (5 seconds)

To change:

```jsx
addToast({
  duration: 8000, // 8 seconds
  // ...
});
```

### Sound Control

Disable sound for specific toast:

```jsx
addToast({
  playSound: false,
  // ...
});
```

### Notification Types

Supported types:

- `message` - New message (blue)
- `mention` - You were mentioned (orange)
- `reply` - Reply to your message (green)
- `file_upload` - File shared (purple)
- `group_invite` - Group invitation (pink)
- `default` - Other notifications (gray)

## Customization

### Styling

Edit `src/components/ToastNotification/ToastNotification.module.css` to customize:

- Colors
- Animations
- Sizes
- Positions

### Sound

Edit `src/components/ToastContainer/ToastContainer.jsx` to:

- Change sound file path
- Adjust volume
- Modify beep frequency/duration

### Behavior

Edit `src/hooks/useToastNotifications.js` to:

- Change when toasts are shown
- Modify navigation behavior
- Add filtering logic

## Testing

### Test Real-Time Notifications

1. Open the app in two different browsers/devices
2. Log in as different users
3. Send a message from User A to User B
4. User B should see:
   - Toast notification appears instantly
   - Sound plays (if sound file exists)
   - Toast shows sender name and message preview
   - Clicking toast navigates to the chat

### Test Sound

1. Ensure `public/sounds/notification.mp3` exists
2. Send a test message
3. Verify sound plays
4. If sound file missing, verify beep plays instead

### Test Cross-Device

1. Open app on desktop browser
2. Open app on mobile browser (or another device)
3. Send message from one device
4. Verify toast appears on other device instantly

## Troubleshooting

### Toasts Not Appearing

1. Check Socket.io connection:

   - Open browser console
   - Look for "Socket connected" message
   - Verify no connection errors

2. Check notification events:

   - Open browser console
   - Look for Socket.io events being received
   - Verify `notification:new` or `message:new` events

3. Check ToastProvider:
   - Ensure app is wrapped in ToastProvider
   - Verify ToastContainer is rendered

### Sound Not Playing

1. Check sound file:

   - Verify `public/sounds/notification.mp3` exists
   - Check file format is supported (MP3, WAV, OGG)

2. Check browser permissions:

   - Some browsers require user interaction before playing sounds
   - Check browser console for audio errors

3. Check volume:
   - Verify system volume is not muted
   - Check browser tab is not muted

### Notifications Not Sending

1. Check server logs:

   - Verify `notifyNewMessage` is being called
   - Check for errors in notification creation

2. Check Socket.io:

   - Verify Socket.io server is running
   - Check user is in correct Socket.io rooms

3. Check notification preferences:
   - Verify user has notifications enabled
   - Check notification categories are enabled

## Performance Considerations

- Toasts are automatically cleaned up after dismissal
- Maximum toast stack is managed (oldest dismissed first)
- Sound playback is non-blocking
- Socket.io events are efficiently handled

## Future Enhancements

Potential improvements:

- [ ] Notification preferences (enable/disable toasts per category)
- [ ] Toast history/queue
- [ ] Different sounds for different notification types
- [ ] Desktop notifications integration
- [ ] Notification grouping (multiple messages from same sender)
- [ ] Do Not Disturb mode
- [ ] Custom notification sounds per user

## API Reference

### ToastContext

```jsx
const { toasts, addToast, removeToast, clearAllToasts } = useToast();
```

#### addToast(toast)

- `id` (string, optional) - Unique ID (auto-generated if not provided)
- `type` (string) - Notification type
- `title` (string) - Toast title
- `body` (string, optional) - Toast body/content
- `duration` (number, optional) - Auto-dismiss duration in ms (default: 5000)
- `playSound` (boolean, optional) - Play sound (default: true)
- `onClick` (function, optional) - Click handler

#### removeToast(id)

Removes toast by ID.

#### clearAllToasts()

Removes all toasts.

### useToastNotifications()

Hook that automatically listens for Socket.io notification events and creates toasts. No parameters required.

## Security Considerations

- Notifications are only sent to authenticated users
- Socket.io connections are authenticated
- User can only receive notifications for chats they're part of
- Notification data is sanitized before display
