# Collaboration Features & Localization Implementation Guide

## 📋 Overview

This document provides a complete guide for implementing all Collaboration Features and Localization & Customization Features in the iChat application.

## 🗂️ File Structure

```
ichat/
├── models/
│   ├── ToDo.js                    ✅ Created
│   ├── Note.js                    ✅ Created
│   ├── Document.js                ✅ Created
│   ├── DocumentVersion.js         ✅ Created
│   ├── Whiteboard.js              ✅ Created
│   ├── Meeting.js                 ✅ Created
│   ├── CalendarIntegration.js     ✅ Created
│   ├── PinnedMessage.js           ✅ Created
│   ├── TaskAssignment.js          ✅ Created
│   ├── UserPreferences.js         ✅ Created
│   ├── LanguagePreferences.js     ✅ Created
│   ├── CustomEmoji.js             ✅ Created
│   ├── Branding.js                ✅ Created
│   └── Draft.js                   ✅ Created
│
├── src/app/api/
│   ├── collaboration/
│   │   ├── todo/
│   │   │   ├── create/route.js    ✅ Created
│   │   │   ├── list/route.js      ✅ Created
│   │   │   └── [id]/route.js      ✅ Created
│   │   ├── notes/
│   │   │   ├── create/route.js   ✅ Created
│   │   │   ├── list/route.js      ✅ Created
│   │   │   └── [id]/route.js      ✅ Created
│   │   ├── drafts/
│   │   │   ├── save/route.js      ✅ Created
│   │   │   ├── get/route.js       ✅ Created
│   │   │   └── delete/route.js   ✅ Created
│   │   ├── whiteboard/
│   │   │   ├── create/route.js    ✅ Created
│   │   │   └── [id]/route.js     ✅ Created
│   │   ├── documents/
│   │   │   ├── create/route.js    ✅ Created
│   │   │   ├── [id]/route.js      ✅ Created
│   │   │   └── [id]/versions/route.js ✅ Created
│   │   └── meetings/
│   │       ├── create/route.js    ✅ Created
│   │       ├── list/route.js      ✅ Created
│   │       └── [id]/rsvp/route.js ✅ Created
│   ├── settings/
│   │   ├── language/route.js      ✅ Created
│   │   ├── theme/route.js          ✅ Created
│   │   ├── background/route.js    ✅ Created
│   │   ├── statusDuration/route.js ✅ Created
│   │   └── branding/route.js      ✅ Created
│   ├── emojis/
│   │   └── custom/
│   │       ├── create/route.js    ✅ Created
│   │       └── list/route.js      ✅ Created
│   └── messages/
│       └── pin/route.js           ✅ Created
│
├── src/components/
│   ├── SharedTodoList/            ✅ Created
│   ├── SharedNotesEditor/         ✅ Created
│   ├── DraftIndicator/            ✅ Created
│   ├── PinnedMessagesPanel/       ✅ Created
│   ├── ThemeSwitcher/             ✅ Created
│   ├── BackgroundPicker/          ✅ Created
│   └── StatusDurationMenu/         ✅ Created
│
└── src/lib/
    └── translations.js             ✅ Created
```

## 🔌 Socket.io Events

All real-time events have been added to `lib/socket.js`:

- `todo:update` - Todo list changes
- `notes:update` - Note updates
- `draft:update` - Draft saves
- `whiteboard:update` - Whiteboard changes
- `document:update` - Document edits
- `meeting:scheduled` - Meeting creation/updates
- `message:pinned` - Message pinning
- `task:assigned` - Task assignments
- `theme:changed` - Theme changes
- `language:changed` - Language changes

## 🎨 Integration Steps

### 1. Integrate SharedTodoList into Chat/Group Pages

**In `src/app/dashboard/page.jsx` or group chat page:**

```jsx
import SharedTodoList from "../../components/SharedTodoList/SharedTodoList.jsx";

// Add a tab or sidebar section
<div className={styles.collaborationTabs}>
  <button onClick={() => setActiveTab('messages')}>Messages</button>
  <button onClick={() => setActiveTab('tasks')}>Tasks</button>
  <button onClick={() => setActiveTab('notes')}>Notes</button>
</div>

{activeTab === 'tasks' && (
  <SharedTodoList 
    chatId={activeChat?._id} 
    groupId={activeGroup?._id}
    currentUserId={user?._id}
  />
)}
```

### 2. Integrate DraftIndicator into MessageInput

**In `src/components/MessageInput/MessageInput.jsx`:**

```jsx
import DraftIndicator from "../DraftIndicator/DraftIndicator.jsx";

// Add at the top of MessageInput component
<DraftIndicator chatId={chatId} groupId={groupId} />

// Add auto-save functionality
useEffect(() => {
  const saveDraft = async () => {
    if (inputValue.trim()) {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/collaboration/drafts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          groupId,
          content: inputValue,
        }),
      });
    }
  };

  const timeoutId = setTimeout(saveDraft, 2000);
  return () => clearTimeout(timeoutId);
}, [inputValue, chatId, groupId]);

// Listen for restore draft event
useEffect(() => {
  const handleRestoreDraft = (event) => {
    setInputValue(event.detail.content || "");
  };
  window.addEventListener("restoreDraft", handleRestoreDraft);
  return () => window.removeEventListener("restoreDraft", handleRestoreDraft);
}, []);
```

### 3. Integrate PinnedMessagesPanel into Chat Header

**In `src/components/ChatHeader/ChatHeader.jsx`:**

```jsx
import PinnedMessagesPanel from "../PinnedMessagesPanel/PinnedMessagesPanel.jsx";

// Add state
const [showPinned, setShowPinned] = useState(false);

// Add button in header
<button onClick={() => setShowPinned(!showPinned)}>
  📌 Pinned ({pinnedCount})
</button>

// Add panel
{showPinned && (
  <PinnedMessagesPanel
    chatId={chatId}
    groupId={groupId}
    onMessageClick={(messageId) => {
      // Scroll to message
      setShowPinned(false);
    }}
  />
)}
```

### 4. Integrate ThemeSwitcher into Profile Settings

**In `src/app/profile/page.jsx`:**

```jsx
import ThemeSwitcher from "../../components/ThemeSwitcher/ThemeSwitcher.jsx";

// In the appearance section
<ThemeSwitcher
  currentTheme={formData.theme}
  onThemeChange={(theme) => {
    setFormData({ ...formData, theme });
    // Apply theme immediately
    document.documentElement.setAttribute("data-theme", theme);
  }}
/>
```

### 5. Integrate BackgroundPicker into Chat Settings

**Create a new settings panel or add to existing:**

```jsx
import BackgroundPicker from "../../components/BackgroundPicker/BackgroundPicker.jsx";

<BackgroundPicker
  chatId={activeChat?._id}
  groupId={activeGroup?._id}
  currentBackground={currentBackground}
  onBackgroundChange={(url) => {
    // Apply background to chat area
    document.querySelector('.chatArea').style.background = url;
  }}
/>
```

### 6. Integrate StatusDurationMenu into Profile

**In `src/app/profile/page.jsx`:**

```jsx
import StatusDurationMenu from "../../components/StatusDurationMenu/StatusDurationMenu.jsx";

// In status settings section
<StatusDurationMenu
  currentDuration={user?.statusDuration}
  onDurationChange={(duration) => {
    // Update user status duration
    fetchUser();
  }}
/>
```

### 7. Add Language Selector Enhancement

**Update `src/components/LanguageSelector/LanguageSelector.jsx`:**

```jsx
import { setLanguage, getCurrentLanguage, getTranslation } from "../../lib/translations.js";

// Add RTL support
const rtlLanguages = ["ar", "he", "ur"];
const isRTL = rtlLanguages.includes(selectedLanguage);

useEffect(() => {
  setLanguage(selectedLanguage);
  if (onLanguageChange) {
    onLanguageChange(selectedLanguage);
  }
}, [selectedLanguage]);

// Apply RTL styles
<div className={`${styles.languageSelector} ${isRTL ? styles.rtl : ''}`}>
  {/* ... */}
</div>
```

### 8. Add Whiteboard Component (Basic Implementation)

Create `src/components/WhiteboardCanvas/WhiteboardCanvas.jsx`:

```jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./WhiteboardCanvas.module.css";

export default function WhiteboardCanvas({ whiteboardId, chatId, groupId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const { socket, connected } = useSocket();

  // Canvas drawing logic here
  // Real-time sync via socket.io

  return (
    <div className={styles.whiteboard}>
      <div className={styles.toolbar}>
        <button onClick={() => setTool("pen")}>Pen</button>
        <button onClick={() => setTool("eraser")}>Eraser</button>
        <button onClick={() => setTool("shape")}>Shape</button>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
```

### 9. Add Meeting Scheduler Component

Create `src/components/MeetingScheduler/MeetingScheduler.jsx`:

```jsx
"use client";

import { useState } from "react";
import styles from "./MeetingScheduler.module.css";

export default function MeetingScheduler({ chatId, groupId, onMeetingCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    duration: 60,
    participants: [],
  });

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    // Call API to create meeting
    // Emit socket event
    // Call onMeetingCreated callback
  };

  return (
    <form onSubmit={handleCreateMeeting} className={styles.meetingForm}>
      {/* Form fields */}
    </form>
  );
}
```

## 🌍 Translation Integration

### Using Translations in Components

```jsx
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";

function MyComponent() {
  const lang = getCurrentLanguage();
  
  return (
    <button>{getTranslation(lang, "save")}</button>
  );
}
```

### Auto-detect Browser Language

```jsx
useEffect(() => {
  const browserLang = navigator.language.split("-")[0];
  const savedLang = localStorage.getItem("language") || browserLang;
  setLanguage(savedLang);
}, []);
```

## 🎨 Theme Integration

### CSS Variables for Themes

Add to `src/app/globals.css`:

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #000000;
  --primary-color: #007bff;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --primary-color: #0d6efd;
}

[data-theme="blue"] {
  --bg-primary: #e7f3ff;
  --bg-secondary: #cfe2ff;
  --text-primary: #084298;
  --primary-color: #0d6efd;
}

[data-theme="green"] {
  --bg-primary: #f0f9f4;
  --bg-secondary: #d1e7dd;
  --text-primary: #0f5132;
  --primary-color: #198754;
}

[data-theme="high-contrast"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --primary-color: #ffff00;
}

/* RTL Support */
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] .chatBubble {
  text-align: right;
}

[dir="rtl"] .messageInput {
  direction: rtl;
}
```

## 📝 Usage Examples

### Creating a Shared Todo

```javascript
const response = await fetch("/api/collaboration/todo/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Complete project",
    description: "Finish the collaboration features",
    chatId: chatId,
    dueDate: "2024-12-31T23:59:59",
    priority: "high",
    assignedTo: userId,
  }),
});
```

### Saving a Draft

```javascript
await fetch("/api/collaboration/drafts/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    chatId: chatId,
    content: messageContent,
  }),
});
```

### Pinning a Message

```javascript
await fetch("/api/messages/pin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    messageId: messageId,
    chatId: chatId,
  }),
});
```

## 🧪 Testing

Run the seed script to populate test data:

```bash
node scripts/seedCollaboration.js
```

## 📚 Additional Components Needed

The following components still need to be created (basic structure provided above):

1. **CollaborativeDocEditor** - Rich text editor with real-time sync
2. **WhiteboardCanvas** - Drawing canvas with tools
3. **MeetingScheduler** - Meeting creation form
4. **TaskAssignmentPanel** - Task assignment UI
5. **FileVersionHistory** - Version comparison UI
6. **CustomEmojiUploader** - Emoji upload interface
7. **BrandingUploader** - Logo/branding upload (admin only)

## 🔄 Real-time Updates

All components listen to Socket.io events for real-time updates. Make sure Socket.io is properly initialized and connected before using these features.

## 🎯 Next Steps

1. ✅ Models created
2. ✅ API routes created
3. ✅ Socket.io events added
4. ✅ Core components created
5. ⏳ Integrate components into pages
6. ⏳ Add remaining components
7. ⏳ Test all features
8. ⏳ Add error handling
9. ⏳ Add loading states
10. ⏳ Optimize performance

## 📞 Support

For issues or questions, refer to the main README.md or create an issue in the repository.

