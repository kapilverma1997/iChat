# Chat Dashboard Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database

```bash
npm run seed
```

This creates 4 sample users:

- **john@example.com** / password123
- **jane@example.com** / password123
- **bob@example.com** / password123
- **alice@example.com** / password123

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with any sample user.

## Features

### ✅ Implemented Features

1. **Chat Dashboard**

   - Left sidebar with chat list
   - Main chat area with messages
   - Real-time updates via Socket.io

2. **Chat Management**

   - Create new chat by email
   - Pin/unpin chats
   - Mute/unmute chats
   - Archive chats
   - Mark as unread
   - Delete chats

3. **Messaging**

   - Send text messages
   - Real-time message delivery
   - Read receipts (single/double tick)
   - Typing indicators
   - Message reactions
   - Reply to messages
   - Edit messages
   - Delete messages
   - Pin/star messages

4. **UI Components**
   - Emoji picker
   - Reaction picker
   - Reply preview
   - Confirmation dialogs
   - User avatars with status
   - Message bubbles

## File Structure

```
ichat/
├── models/
│   ├── Chat.js              # Chat schema
│   └── Message.js           # Message schema
├── lib/
│   ├── socket.js            # Socket.io server
│   └── auth.js              # Auth helpers
├── scripts/
│   └── seed.js              # Database seeder
├── server.js                # Custom server
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── chat/        # Chat API routes
    │   │   └── messages/    # Message API routes
    │   └── dashboard/       # Chat dashboard page
    ├── components/          # React components
    └── hooks/
        └── useSocket.js     # Socket.io hook
```

## API Endpoints

### Chat

- `POST /api/chat/create` - Create new chat
- `GET /api/chat/list` - List all chats
- `DELETE /api/chat/delete` - Delete chat
- `PATCH /api/chat/update` - Update chat

### Messages

- `POST /api/messages/send` - Send message
- `GET /api/messages/list` - Get messages
- `DELETE /api/messages/delete` - Delete message
- `POST /api/messages/react` - Add reaction
- `PATCH /api/messages/update` - Update message

## Socket.io Events

### Client → Server

- `joinChat(chatId)`
- `leaveChat(chatId)`
- `typing({ chatId, userId })`
- `stopTyping({ chatId, userId })`

### Server → Client

- `receiveMessage({ message, chatId })`
- `typing({ userId, chatId })`
- `stopTyping({ userId, chatId })`
- `messageDeleted({ messageId, chatId })`
- `reactionAdded({ messageId, reactions, chatId })`
- `messageUpdated({ message, chatId })`
- `chatDeleted({ chatId })`

## Testing the Chat

1. **Login** with `john@example.com` / `password123`
2. **Create Chat**: Click "New Chat", enter `jane@example.com`
3. **Send Message**: Type and send a message
4. **Open Second Browser**: Login as `jane@example.com`
5. **See Real-time**: Message appears instantly
6. **React**: Click message menu → React → Choose emoji
7. **Reply**: Click message menu → Reply → Type reply
8. **Edit**: Click message menu → Edit → Modify text
9. **Delete**: Click message menu → Delete → Confirm

## Troubleshooting

### Socket.io not connecting

- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check browser console for errors
- Verify custom server is running

### Messages not appearing

- Check MongoDB connection
- Verify API routes are working
- Check Socket.io events in network tab

### Authentication errors

- Ensure user is logged in
- Check JWT token in localStorage
- Verify token hasn't expired

## Next Steps

- Add file/image upload
- Implement group chats
- Add message search
- Implement push notifications
- Add voice/video calls
