# Chat Dashboard + Real-Time 1:1 Chat Module

Complete implementation of a real-time chat dashboard with Socket.io integration.

## 📁 Folder Structure

```
ichat/
├── models/
│   ├── Chat.js                    # Chat MongoDB model
│   └── Message.js                 # Message MongoDB model
├── lib/
│   ├── socket.js                  # Socket.io server setup
│   └── auth.js                    # Authentication helper
├── scripts/
│   └── seed.js                    # Database seeding script
├── server.js                      # Custom Next.js server with Socket.io
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   ├── create/route.js
│   │   │   │   ├── list/route.js
│   │   │   │   ├── delete/route.js
│   │   │   │   └── update/route.js
│   │   │   └── messages/
│   │   │       ├── send/route.js
│   │   │       ├── list/route.js
│   │   │       ├── delete/route.js
│   │   │       ├── react/route.js
│   │   │       └── update/route.js
│   │   └── dashboard/
│   │       └── page.jsx           # Main chat dashboard page
│   ├── components/
│   │   ├── DashboardLayout/       # Main chat layout
│   │   ├── Sidebar/               # Chat list sidebar
│   │   ├── ChatListItem/         # Individual chat item
│   │   ├── CreateChatModal/      # Create new chat modal
│   │   ├── ChatHeader/            # Chat header with user info
│   │   ├── MessageList/           # Messages container
│   │   ├── MessageItem/           # Individual message
│   │   ├── MessageInput/          # Message input box
│   │   ├── ReplyPreview/          # Reply preview component
│   │   ├── ReactionPicker/       # Quick reaction picker
│   │   ├── Modal/                 # Reusable modal
│   │   ├── Avatar/                # User avatar component
│   │   ├── ConfirmationDialog/   # Confirmation dialog
│   │   └── EmojiPicker/           # Emoji picker
│   ├── hooks/
│   │   └── useSocket.js           # Socket.io client hook
│   └── lib/
│       └── utils.js               # Client-side utilities
└── package.json
```

## 🗄️ Database Models

### Chat Model

```javascript
{
  participants: [ObjectId],      // Array of user IDs
  messages: [ObjectId],          // Array of message IDs
  isPinned: Boolean,
  isMuted: Boolean,
  isArchived: Boolean,
  unreadCount: Map,              // Map of userId -> count
  wallpaper: String,
  lastMessage: ObjectId,
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  chatId: ObjectId,
  senderId: ObjectId,
  content: String,
  type: 'text' | 'image' | 'file' | 'video',
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  reactions: [{ emoji: String, userId: ObjectId }],
  replyTo: ObjectId,            // Reference to replied message
  isStarred: Boolean,
  isPinned: Boolean,
  isDeleted: Boolean,
  deletedAt: Date,
  deliveredAt: Date,
  readBy: [{ userId: ObjectId, readAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Routes

### Chat Routes

#### POST `/api/chat/create`

Create a new chat by searching for a user by email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Chat created successfully",
  "chat": {
    "_id": "...",
    "participants": [...],
    "lastMessage": null,
    "lastMessageAt": "...",
    "unreadCount": {}
  }
}
```

#### GET `/api/chat/list`

Get all chats for the logged-in user.

**Response:**

```json
{
  "chats": [
    {
      "_id": "...",
      "otherUser": {...},
      "lastMessage": {...},
      "lastMessageAt": "...",
      "isPinned": false,
      "isMuted": false,
      "unreadCount": 0
    }
  ]
}
```

#### DELETE `/api/chat/delete?chatId=...`

Delete a chat (with all messages).

#### PATCH `/api/chat/update`

Update chat properties (pin, mute, archive, etc.).

**Request:**

```json
{
  "chatId": "...",
  "isPinned": true,
  "isMuted": false,
  "isArchived": false,
  "wallpaper": "...",
  "unreadCount": 0
}
```

### Message Routes

#### POST `/api/messages/send`

Send a new message.

**Request:**

```json
{
  "chatId": "...",
  "content": "Hello!",
  "type": "text",
  "replyTo": "..." // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "_id": "...",
    "chatId": "...",
    "senderId": {...},
    "content": "Hello!",
    "createdAt": "..."
  }
}
```

#### GET `/api/messages/list?chatId=...&page=1&limit=50`

Get messages for a chat.

#### DELETE `/api/messages/delete?messageId=...`

Delete a message (soft delete).

#### POST `/api/messages/react`

Add or remove a reaction.

**Request:**

```json
{
  "messageId": "...",
  "emoji": "❤️"
}
```

#### PATCH `/api/messages/update`

Update message (edit content, star, pin).

**Request:**

```json
{
  "messageId": "...",
  "content": "Updated content", // Optional
  "isStarred": true, // Optional
  "isPinned": false // Optional
}
```

## 🔌 Socket.io Events

### Client → Server

- `joinChat(chatId)` - Join a chat room
- `leaveChat(chatId)` - Leave a chat room
- `typing({ chatId, userId })` - User is typing
- `stopTyping({ chatId, userId })` - User stopped typing

### Server → Client

- `receiveMessage({ message, chatId })` - New message received
- `typing({ userId, chatId })` - User is typing
- `stopTyping({ userId, chatId })` - User stopped typing
- `messageDeleted({ messageId, chatId })` - Message was deleted
- `reactionAdded({ messageId, reactions, chatId })` - Reaction added/removed
- `messageUpdated({ message, chatId })` - Message was updated
- `chatDeleted({ chatId })` - Chat was deleted

## 🎨 Components

### DashboardLayout

Main layout component that combines Sidebar and Chat Area.

**Props:**

- `chats` - Array of chat objects
- `activeChat` - Currently selected chat
- `messages` - Array of messages for active chat
- `currentUserId` - Current user ID
- `onSelectChat` - Callback when chat is selected
- `onSendMessage` - Callback to send a message
- `onReplyMessage` - Callback to reply to a message
- `onReactMessage` - Callback to react to a message
- `onStarMessage` - Callback to star/unstar a message
- `onPinMessage` - Callback to pin/unpin a message
- `onDeleteMessage` - Callback to delete a message
- `onEditMessage` - Callback to edit a message
- `typingUsers` - Array of user IDs currently typing

### Sidebar

Displays list of chats with actions.

**Features:**

- List all chats
- Create new chat button
- Chat actions: Pin, Mute, Archive, Mark unread, Delete

### ChatListItem

Individual chat item in the sidebar.

**Features:**

- User avatar with status
- Last message preview
- Unread count badge
- Last message time
- Context menu with actions

### MessageItem

Individual message component.

**Features:**

- Message bubble (sent/received styling)
- Read receipts (single/double tick)
- Reactions display
- Reply preview
- Message actions menu
- Edit message (inline)
- Delete message

### MessageInput

Input component for typing messages.

**Features:**

- Text input with emoji support
- Reply preview
- Emoji picker
- Typing indicator
- Send button

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Add to `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database

```bash
npm run seed
```

This creates sample users:

- john@example.com / password123
- jane@example.com / password123
- bob@example.com / password123
- alice@example.com / password123

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📝 Usage Example

### Creating a Chat

1. Click "New Chat" button in sidebar
2. Enter user email address
3. Click "Create Chat"
4. Chat appears in sidebar

### Sending Messages

1. Select a chat from sidebar
2. Type message in input box
3. Press Enter or click Send
4. Message appears in real-time

### Replying to Messages

1. Click message menu (⋮)
2. Select "Reply"
3. Type reply
4. Reply shows preview of original message

### Reacting to Messages

1. Click message menu
2. Select "React"
3. Choose emoji
4. Reaction appears on message

### Editing Messages

1. Click message menu
2. Select "Edit"
3. Modify content inline
4. Press Enter to save

### Deleting Messages

1. Click message menu
2. Select "Delete"
3. Confirm deletion
4. Message is soft-deleted

## 🔧 Features Implemented

✅ Real-time messaging with Socket.io
✅ Chat list with last message preview
✅ Create new chat by email search
✅ Pin, mute, archive chats
✅ Mark chats as unread
✅ Delete chats (with confirmation)
✅ Read receipts (single/double tick)
✅ Message reactions
✅ Reply to messages
✅ Pin/star messages
✅ Edit messages
✅ Delete messages (soft delete)
✅ Typing indicators
✅ Emoji picker
✅ Custom chat wallpaper support
✅ Message delivery status
✅ User presence status
✅ Last seen timestamps

## 🎯 Workflow Example

1. **Login** → User logs in with credentials
2. **View Chats** → Dashboard shows list of chats
3. **Create Chat** → Click "New Chat", enter email, create
4. **Select Chat** → Click on a chat to open
5. **Send Message** → Type and send message
6. **Real-time Update** → Message appears instantly via Socket.io
7. **Read Receipt** → Double tick shows when read
8. **React** → Add reaction to message
9. **Reply** → Reply to specific message
10. **Delete** → Delete message with confirmation

## 🐛 Troubleshooting

### Socket.io not connecting

- Check `NEXT_PUBLIC_APP_URL` environment variable
- Ensure custom server is running (`npm run dev`)
- Check browser console for connection errors

### Messages not appearing

- Verify MongoDB connection
- Check API routes are working
- Verify Socket.io events are being emitted

### Authentication errors

- Ensure JWT token is in localStorage
- Check token expiration
- Verify user is logged in

## 📚 Next Steps

- Add file/image upload support
- Implement group chats
- Add message search
- Implement message forwarding
- Add voice/video call integration
- Implement push notifications
