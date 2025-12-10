# Chat Message Types Implementation

## ✅ Completed Features

This document outlines all the chat message types and related features that have been implemented.

## 📋 Message Types Supported

### 1. **Text Messages**

- Standard text messages with support for multi-line input
- Shift+Enter for new lines, Enter to send

### 2. **Emojis, GIFs, Stickers**

- Single emoji messages (sent as `emoji` type)
- Emoji picker integration
- Support for GIF and sticker types (ready for future integration)

### 3. **Voice Messages**

- Real-time voice recording using browser MediaRecorder API
- Audio playback controls
- Recording timer display
- Sends as `voice` or `audio` type

### 4. **Images, Videos, Documents**

- File upload support for:
  - Images (jpg, png, gif, webp, svg)
  - Videos (mp4, webm, ogg, mov, avi)
  - Documents (pdf, doc, docx, xls, xlsx, ppt, pptx)
  - Audio files (mp3, wav, ogg, m4a, aac)
- File previews with thumbnails
- File size display
- Multiple file selection

### 5. **Location Sharing**

- Browser geolocation API integration
- Google Maps link generation
- Coordinates display
- Sends as `location` type with metadata

### 6. **Contact Sharing**

- Contact information sharing
- Name, phone, email support
- Sends as `contact` type with metadata

### 7. **Camera Capture**

- Photo capture from webcam
- Video recording from webcam
- Preview before sending
- Retake functionality
- Sends as `image` or `video` type

### 8. **Inline URL Preview**

- Automatic URL detection in text messages
- Open Graph tag parsing
- Preview cards with:
  - Title
  - Description
  - Thumbnail image
  - Link to original URL

### 9. **Code Snippets**

- Code block mode toggle
- Syntax highlighting ready (can be enhanced)
- Language metadata support
- Sends as `code` type

### 10. **Markdown Support**

- Markdown rendering for:
  - **Bold** text (`**text**` or `__text__`)
  - _Italic_ text (`*text*` or `_text_`)
  - `Inline code` (backticks)
  - Code blocks (triple backticks)
  - Links (`[text](url)`)
  - Lists (ordered and unordered)
- Sends as `markdown` type

### 11. **Reactions & Emoji Picker**

- Multiple reactions per message
- Reaction count display
- Click to add/remove reactions
- Real-time reaction updates via Socket.io
- Grouped reactions by emoji

## 🗄️ Database Schema Updates

### Message Model

```javascript
{
  chatId: ObjectId,
  senderId: ObjectId,
  content: String,
  type: 'text' | 'emoji' | 'gif' | 'sticker' | 'image' | 'video' |
        'file' | 'voice' | 'location' | 'contact' | 'code' | 'markdown' | 'audio',
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  metadata: Mixed, // For location coordinates, contact info, code language, etc.
  reactions: [{ emoji: String, userId: ObjectId }],
  replyTo: ObjectId,
  isStarred: Boolean,
  isPinned: Boolean,
  isDeleted: Boolean,
  deliveredAt: Date,
  readBy: [{ userId: ObjectId, readAt: Date }],
  timestamps: true
}
```

## 🧩 Components Created

### 1. **FilePreview.jsx**

- Displays file previews for images, videos, and documents
- Shows file icons, names, and sizes
- Remove button for file selection

### 2. **LinkPreview.jsx**

- Fetches and displays URL previews
- Shows title, description, and thumbnail
- Fallback to plain link if preview fails

### 3. **VoiceRecorder.jsx**

- Records audio using MediaRecorder API
- Shows recording timer
- Playback controls
- Send/Cancel actions

### 4. **CameraCapture.jsx**

- Full-screen camera interface
- Photo and video capture modes
- Preview before sending
- Retake functionality

### 5. **ReactionList.jsx**

- Displays grouped reactions
- Shows reaction counts
- Highlights user's own reactions
- Click to toggle reactions

## 🔄 Updated Components

### 1. **MessageItem.jsx**

- Dynamic rendering based on message type
- Support for all message types
- Integrated ReactionList
- FilePreview integration
- LinkPreview integration
- Markdown rendering
- Code block display

### 2. **MessageInput.jsx**

- Toolbar with multiple input options:
  - 📎 File attachment
  - 📷 Camera capture
  - 🎤 Voice recording
  - 📍 Location sharing
  - 👤 Contact sharing
  - `</>` Code mode toggle
  - `M↓` Markdown mode toggle
- File preview before sending
- Multiple file selection
- Emoji picker integration

## 🔌 API Routes

### 1. **POST /api/messages/send**

- Sends text, emoji, location, contact, code, markdown messages
- Supports metadata for location and contact
- Real-time Socket.io broadcasting

### 2. **POST /api/messages/upload**

- Handles file uploads (images, videos, documents, audio)
- Auto-detects file type
- Saves files to `/public/uploads`
- Creates message with file metadata

### 3. **GET /api/messages/link-preview**

- Fetches URL previews
- Parses Open Graph tags
- Returns title, description, image

### 4. **POST /api/messages/react**

- Adds/removes reactions
- Real-time Socket.io updates

### 5. **DELETE /api/messages/delete**

- Soft deletes messages
- Real-time Socket.io updates

## 🔌 Socket.io Events

### Client → Server

- `joinChat` - Join a chat room
- `leaveChat` - Leave a chat room
- `typing` - User is typing
- `stopTyping` - User stopped typing

### Server → Client

- `receiveMessage` - New message received
- `reactionAdded` - Reaction added/removed
- `messageDeleted` - Message deleted
- `messageUpdated` - Message updated
- `typing` - User typing indicator
- `stopTyping` - User stopped typing indicator

## 📁 File Structure

```
src/
├── components/
│   ├── FilePreview/          # File preview component
│   ├── LinkPreview/           # URL preview component
│   ├── VoiceRecorder/         # Voice recording component
│   ├── CameraCapture/         # Camera capture component
│   ├── ReactionList/          # Reaction display component
│   ├── MessageItem/           # Updated message display
│   └── MessageInput/          # Updated input with all features
├── app/
│   └── api/
│       └── messages/
│           ├── send/          # Send message route
│           ├── upload/        # File upload route
│           └── link-preview/  # URL preview route
└── lib/
    └── markdown.js            # Markdown parser utility
```

## 🎨 Styling

All components use CSS Modules for scoped styling:

- Responsive design
- Dark mode support
- Smooth animations
- Modern UI/UX

## 🚀 Usage Examples

### Send Text Message

```javascript
handleSendMessage("Hello!", null, "text");
```

### Send Emoji Message

```javascript
handleSendMessage("😊", null, "emoji");
```

### Send Location

```javascript
handleSendMessage("Location shared", null, "location", {
  metadata: { latitude: 40.7128, longitude: -74.006 },
});
```

### Send Contact

```javascript
handleSendMessage("John Doe", null, "contact", {
  metadata: {
    name: "John Doe",
    phone: "+1234567890",
    email: "john@example.com",
  },
});
```

### Send Code

```javascript
handleSendMessage("const x = 5;", null, "code", {
  metadata: { language: "javascript" },
});
```

### Send Markdown

```javascript
handleSendMessage("**Bold** and *italic* text", null, "markdown");
```

### Upload File

```javascript
const formData = new FormData();
formData.append("file", fileBlob);
formData.append("chatId", chatId);
formData.append("type", "image");
fetch("/api/messages/upload", { method: "POST", body: formData });
```

## 🔒 Security Considerations

1. **File Uploads**

   - Files saved to `/public/uploads` directory
   - File type validation
   - File size limits (can be added)

2. **Location Sharing**

   - Requires user permission
   - Only shared when user explicitly requests

3. **Camera Access**

   - Requires user permission
   - Only accessed when user explicitly requests

4. **Voice Recording**
   - Requires microphone permission
   - Only accessed when user explicitly requests

## 📝 Notes

- All file uploads are stored locally in `/public/uploads`
- For production, consider using cloud storage (S3, Cloudinary)
- URL preview fetching may be rate-limited by target sites
- Markdown parser is basic; can be enhanced with libraries like `marked` or `remark`
- Code syntax highlighting can be added with libraries like `highlight.js` or `prism.js`

## 🎯 Future Enhancements

1. **GIF Integration**

   - GIPHY API integration
   - GIF search and selection

2. **Sticker Packs**

   - Custom sticker packs
   - Sticker store

3. **Screen Sharing**

   - Screen capture API
   - For video calls

4. **Message Forwarding**

   - Forward messages to other chats

5. **Message Search**

   - Search within chat
   - Filter by message type

6. **Message Pinning**

   - Pin important messages
   - Pinned messages list

7. **Message Starring**
   - Star favorite messages
   - Starred messages list

## ✅ Testing Checklist

- [x] Text messages
- [x] Emoji messages
- [x] Image uploads
- [x] Video uploads
- [x] Document uploads
- [x] Voice messages
- [x] Location sharing
- [x] Contact sharing
- [x] Camera capture (photo)
- [x] Camera capture (video)
- [x] Code snippets
- [x] Markdown messages
- [x] URL previews
- [x] Reactions
- [x] Message deletion
- [x] Real-time updates via Socket.io
