# Quick Integration Guide

## 🚀 Fastest Way to Integrate Components

### 1. Add Collaboration Tabs to Dashboard (5 minutes)

**File**: `src/app/dashboard/page.jsx`

Add this state:

```jsx
const [activeTab, setActiveTab] = useState("messages");
```

Add tabs UI:

```jsx
<div className={styles.tabs}>
  <button onClick={() => setActiveTab("messages")}>Messages</button>
  <button onClick={() => setActiveTab("tasks")}>Tasks</button>
  <button onClick={() => setActiveTab("notes")}>Notes</button>
</div>
```

Add components:

```jsx
{
  activeTab === "tasks" && (
    <SharedTodoList chatId={activeChat?._id} currentUserId={user?._id} />
  );
}
{
  activeTab === "notes" && (
    <SharedNotesEditor chatId={activeChat?._id} currentUserId={user?._id} />
  );
}
```

### 2. Add Draft Indicator to Message Input (3 minutes)

**File**: `src/components/MessageInput/MessageInput.jsx`

Add import:

```jsx
import DraftIndicator from "../DraftIndicator/DraftIndicator.jsx";
```

Add component:

```jsx
<DraftIndicator chatId={chatId} groupId={groupId} />
```

Add auto-save (inside component):

```jsx
useEffect(() => {
  const timeoutId = setTimeout(async () => {
    if (inputValue.trim()) {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/collaboration/drafts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, groupId, content: inputValue }),
      });
    }
  }, 2000);
  return () => clearTimeout(timeoutId);
}, [inputValue, chatId, groupId]);
```

### 3. Add Pinned Messages to Chat Header (3 minutes)

**File**: `src/components/ChatHeader/ChatHeader.jsx`

Add import:

```jsx
import PinnedMessagesPanel from "../PinnedMessagesPanel/PinnedMessagesPanel.jsx";
```

Add state:

```jsx
const [showPinned, setShowPinned] = useState(false);
```

Add button:

```jsx
<button onClick={() => setShowPinned(!showPinned)}>📌 Pinned</button>
```

Add panel:

```jsx
{
  showPinned && (
    <PinnedMessagesPanel
      chatId={chatId}
      onMessageClick={(messageId) => {
        // Scroll to message
        setShowPinned(false);
      }}
    />
  );
}
```

### 4. Add Theme Switcher to Profile (2 minutes)

**File**: `src/app/profile/page.jsx`

Add import:

```jsx
import ThemeSwitcher from "../../components/ThemeSwitcher/ThemeSwitcher.jsx";
```

Add component in appearance section:

```jsx
<ThemeSwitcher
  currentTheme={formData.theme}
  onThemeChange={(theme) => {
    setFormData({ ...formData, theme });
    document.documentElement.setAttribute("data-theme", theme);
  }}
/>
```

### 5. Add CSS Theme Variables (5 minutes)

**File**: `src/app/globals.css`

Add at the end:

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

[dir="rtl"] {
  direction: rtl;
}
```

### 6. Test Everything (5 minutes)

1. Start your dev server: `npm run dev`
2. Login and open a chat
3. Click "Tasks" tab - create a todo
4. Click "Notes" tab - create a note
5. Type in message input - draft should auto-save
6. Pin a message - check pinned panel
7. Go to profile - change theme
8. Change language - check RTL for Arabic

## ✅ That's It!

All core features are now integrated. The remaining components (Whiteboard, Document Editor, Meeting Scheduler) can be added later as needed.

## 🐛 Troubleshooting

**Drafts not saving?**

- Check Socket.io connection
- Verify API route is accessible
- Check browser console for errors

**Real-time updates not working?**

- Ensure Socket.io is connected
- Check `useSocket` hook is working
- Verify socket events are being emitted

**Themes not applying?**

- Check CSS variables are defined
- Verify `data-theme` attribute is set
- Check component CSS uses variables

**RTL not working?**

- Verify language is set to Arabic/Hebrew/Urdu
- Check `dir="rtl"` attribute on html element
- Ensure RTL styles are in CSS

## 📚 Full Documentation

See `COLLABORATION_LOCALIZATION_IMPLEMENTATION.md` for complete details.
