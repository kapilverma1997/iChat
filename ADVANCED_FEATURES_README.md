# Advanced Messaging Features & File Management

This document describes all the advanced messaging and file management features implemented in the chat system.

## 🟦 Advanced Messaging Features

### Message Actions

#### 1. Edit Message

- **API**: `PATCH /api/messages/edit`
- **Socket Event**: `message:edit`
- **Component**: `EditMessageModal`
- Real-time update for both sender and receiver
- Shows "(edited)" label on edited messages

#### 2. Delete Message

- **Delete for Me**: Only removes message from your view
- **Delete for Everyone**: WhatsApp-style deletion (removes for all participants)
- **API**: `DELETE /api/messages/delete?messageId=xxx&deleteForEveryone=true/false`
- **Socket Events**: `message:deleteForMe`, `message:deleteEveryone`

#### 3. Forward Message

- Forward to another chat or group
- **API**: `POST /api/messages/forward`
- **Socket Event**: `message:forward`
- **Component**: `ForwardMessageModal`
- Preserves original message content and metadata

#### 4. Quote Message

- Reply with quoted message preview
- **Component**: `QuotePreview`
- Shows sender name, time, and message preview
- **Socket Event**: `message:quote`

#### 5. Multi-Select Messages

- Shift/Ctrl+Click to select multiple messages
- **Component**: `MultiSelectBar`
- Bulk actions: forward, tag, delete

### Message Tags

Tag messages with:

- **Important**: Mark important messages
- **To-Do**: Mark tasks/reminders
- **Reminder**: Set reminders

**API**: `PATCH /api/messages/tags`
**Socket Event**: `message:tags`

### Message Priority

Set message priority:

- **Normal**: Default priority
- **Important**: Highlighted with orange badge
- **Urgent**: Highlighted with red badge

**API**: `PATCH /api/messages/priority`
**Socket Event**: `message:priority`
**Component**: `PriorityLabel`

### Smart Messaging

#### 1. Schedule Message

- Schedule messages to send at a future date/time
- **API**:
  - `POST /api/messages/schedule` - Create scheduled message
  - `GET /api/messages/schedule` - List scheduled messages
- **Component**: `ScheduleMessageModal`
- **Cron Job**: Automatically sends scheduled messages

#### 2. Message Reminders

- Set reminders for messages ("Remind me later")
- **API**:
  - `POST /api/messages/reminder` - Create reminder
  - `GET /api/messages/reminder` - List reminders
  - `PATCH /api/messages/reminder` - Update reminder
- **Component**: `ReminderModal`
- **Cron Job**: Processes reminders and emits notifications

#### 3. Message Expiration

- Auto-delete messages after X minutes/hours/days
- Set `expiresAt` field on message
- **Cron Job**: Automatically deletes expired messages
- **Socket Event**: `message:expired`

#### 4. Translate Messages

- Translate messages to different languages
- **API**: `POST /api/messages/translate`
- **Socket Event**: `message:translate`
- Currently uses placeholder - integrate with Google Translate API or LibreTranslate

### Text Formatting

Support for rich text formatting:

- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Underline**: `__text__`
- **Code Block**: Triple backticks
- **Markdown**: Full markdown support

**Component**: Updated `MessageInput` with formatting toolbar

## 🟦 File & Media Management

### File Uploads

#### Supported File Types

- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOCX, PPT, XLS
- **Videos**: MP4, MOV, AVI
- **Audio**: MP3, WAV, OGG

#### Upload Methods

- **Drag & Drop**: Drag files into chat area
- **File Picker**: Click attachment button
- **Camera**: Capture photo/video directly
- **Microphone**: Record audio messages

#### Upload Features

- **Compression**: Optional image compression
- **Thumbnails**: Auto-generated for images/videos
- **High Quality**: Option to upload original quality

**API**: `POST /api/files/upload`

### File Handling

#### File Preview

- **Images**: Inline preview with thumbnail
- **Videos**: Video player with controls
- **PDFs**: PDF viewer (browser-native)
- **Documents**: File icon with download option
- **Audio**: Audio player

**Component**: `FilePreview`

#### File Download

- Click file to download
- Shows file size and type

#### File Expiration

- Set expiration date on files
- **Cron Job**: Automatically deletes expired files
- Shows "expired file" message
- **Socket Event**: `file:deleted`

### Media Organization

#### Shared Media Tabs

- **Images Tab**: All shared images
- **Videos Tab**: All shared videos
- **Documents Tab**: All shared documents
- **Links Tab**: All shared links
- **Audio Tab**: All audio files

**Component**: `SharedMediaTabs`
**API**: `GET /api/files/shared?chatId=xxx&category=images`

#### File Search

- Search by file name
- Filter by file type (image/video/document/audio)
- **Component**: `FileSearch`
- **API**: `GET /api/files/search?chatId=xxx&type=image&query=photo`

### Cloud Storage Integration

Basic structure provided for:

- **Google Drive**: Upload, retrieve, share
- **OneDrive**: Upload, retrieve, share
- **Dropbox**: Upload, retrieve, share

**File**: `lib/cloudStorage.js`

**Note**: Requires OAuth setup and API keys for each provider.

## 🗄️ Database Models

### Message Model (Updated)

```javascript
{
  // ... existing fields
  priority: 'normal' | 'important' | 'urgent',
  tags: ['important', 'todo', 'reminder'],
  scheduledAt: Date,
  expiresAt: Date,
  edited: Boolean,
  editedAt: Date,
  deletedFor: [ObjectId],
  isDeletedForEveryone: Boolean,
  forwardedFrom: {
    messageId: ObjectId,
    chatId: ObjectId,
    groupId: ObjectId
  },
  quotedMessage: ObjectId,
  translation: {
    language: String,
    content: String
  },
  attachments: [{
    fileId: ObjectId,
    url: String,
    thumbnail: String,
    type: String,
    name: String,
    size: Number
  }]
}
```

### File Model

```javascript
{
  url: String,
  thumbnail: String,
  metadata: {
    size: Number,
    type: String, // 'image', 'video', 'document', 'audio'
    name: String,
    mimeType: String,
    width: Number,
    height: Number,
    duration: Number
  },
  uploadedBy: ObjectId,
  chatId: ObjectId,
  groupId: ObjectId,
  expiresAt: Date,
  cloudStorage: {
    provider: String, // 'google-drive', 'onedrive', 'dropbox', 'local'
    cloudUrl: String,
    cloudFileId: String
  }
}
```

### Reminder Model

```javascript
{
  messageId: ObjectId,
  userId: ObjectId,
  remindAt: Date,
  isCompleted: Boolean,
  completedAt: Date
}
```

### ScheduledMessage Model

```javascript
{
  message: {
    content: String,
    type: String,
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    metadata: Mixed,
    priority: String,
    tags: [String]
  },
  sendAt: Date,
  targetChat: ObjectId,
  targetGroup: ObjectId,
  senderId: ObjectId,
  isSent: Boolean,
  sentAt: Date,
  error: String
}
```

## 🔌 API Endpoints

### Messages

- `PATCH /api/messages/edit` - Edit message
- `DELETE /api/messages/delete` - Delete message (for me/everyone)
- `POST /api/messages/forward` - Forward message
- `POST /api/messages/schedule` - Schedule message
- `GET /api/messages/schedule` - List scheduled messages
- `POST /api/messages/reminder` - Create reminder
- `GET /api/messages/reminder` - List reminders
- `PATCH /api/messages/reminder` - Update reminder
- `PATCH /api/messages/priority` - Set message priority
- `PATCH /api/messages/tags` - Set message tags
- `POST /api/messages/translate` - Translate message

### Files

- `POST /api/files/upload` - Upload file
- `GET /api/files/search` - Search files
- `GET /api/files/shared` - Get shared media

## 🔌 Socket.io Events

### Client → Server

- `message:quote` - Quote a message
- `messages:select` - Multi-select messages

### Server → Client

- `message:edit` - Message edited
- `message:deleteForMe` - Message deleted for user
- `message:deleteEveryone` - Message deleted for everyone
- `message:forward` - Message forwarded
- `message:quote` - Message quoted
- `message:priority` - Message priority changed
- `message:tags` - Message tags changed
- `message:translate` - Message translated
- `message:mediaUploaded` - Media file uploaded
- `message:expired` - Message expired
- `file:deleted` - File deleted
- `reminder:due` - Reminder due

## ⚙️ Cron Jobs

Automated tasks running every minute:

1. **Process Scheduled Messages**: Sends scheduled messages when `sendAt` time arrives
2. **Process Message Expiration**: Deletes expired messages
3. **Process File Expiration**: Deletes expired files
4. **Process Reminders**: Emits reminder notifications

**File**: `scripts/cronJobs.js`

## 🧩 Frontend Components

### Message Components

- `MessageActionsMenu` - Context menu for message actions
- `EditMessageModal` - Edit message modal
- `ForwardMessageModal` - Forward message modal
- `QuotePreview` - Quoted message preview
- `PriorityLabel` - Priority badge
- `MultiSelectBar` - Multi-select toolbar
- `ScheduleMessageModal` - Schedule message modal
- `ReminderModal` - Set reminder modal

### File Components

- `FilePreview` - File preview component
- `FileSearch` - File search component
- `SharedMediaTabs` - Shared media tabs

### Updated Components

- `MessageInput` - Added text formatting toolbar
- `MessageItem` - Added support for all new features

## 🚀 Usage

### Seed Sample Data

```bash
npm run seed:advanced
```

This creates:

- Messages with various priorities and tags
- Quoted messages
- Forwarded messages
- Edited messages
- Scheduled messages
- Reminders
- Sample files

### Example: Edit Message

```javascript
const response = await fetch("/api/messages/edit", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messageId: "...",
    content: "Updated content",
  }),
});
```

### Example: Schedule Message

```javascript
const response = await fetch("/api/messages/schedule", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "Hello!",
    sendAt: "2024-12-25T09:00:00Z",
    targetChatId: "...",
    priority: "important",
    tags: ["reminder"],
  }),
});
```

### Example: Set Reminder

```javascript
const response = await fetch("/api/messages/reminder", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messageId: "...",
    remindAt: "2024-12-25T10:00:00Z",
  }),
});
```

## 📝 Notes

1. **Translation API**: Currently uses placeholder. Integrate with:

   - Google Translate API (requires API key)
   - LibreTranslate (free, self-hosted)
   - Azure Translator

2. **Cloud Storage**: Basic structure provided. Requires:

   - OAuth2 setup for each provider
   - API keys and credentials
   - Install provider SDKs (googleapis, @microsoft/microsoft-graph-client, dropbox)

3. **File Compression**: Uses Sharp library (optional). Install with:

   ```bash
   npm install sharp
   ```

4. **Cron Jobs**: Run automatically when server starts. Adjust interval in `scripts/cronJobs.js`.

5. **Socket Events**: All events are real-time and update UI automatically.

## ✅ Features Checklist

- [x] Edit message
- [x] Delete for me/everyone
- [x] Forward message
- [x] Quote message
- [x] Multi-select messages
- [x] Message tags (Important, To-Do, Reminder)
- [x] Message priority (Normal, Important, Urgent)
- [x] Schedule message
- [x] Message reminders
- [x] Message expiration
- [x] Translate messages (placeholder)
- [x] Text formatting (bold, italic, underline, code, markdown)
- [x] File uploads (images, documents, videos, audio)
- [x] Drag & drop upload
- [x] Camera/microphone upload
- [x] File preview
- [x] File download
- [x] File expiration
- [x] Shared media tabs
- [x] File search
- [x] Cloud storage structure (basic)
- [x] Real-time socket events
- [x] Cron jobs
- [x] Sample data seeding
