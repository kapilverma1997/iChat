// Service Worker for Push Notifications
// Install event - ensure service worker is activated
self.addEventListener('install', function (event) {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', function (event) {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
});

// Push event handler
self.addEventListener('push', function (event) {
  console.log('📬 Push event received', event);

  let data = {};
  try {
    if (event.data) {
      console.log("event.data", event.data);
      // Try to parse as JSON
      const text = event.data.text();
      console.log("text", text);
      try {
        data = JSON.parse(text);
        console.log('✅ Parsed push data as JSON:', data);
      } catch (parseError) {
        // If parsing fails, check if it's plain text (e.g., from DevTools testing)
        // Use the text as the notification body
        console.log('📝 Push data is plain text (not JSON), using as notification body');
        data = {
          title: 'iChat Notification',
          body: text || 'You have a new notification',
        };
      }
    } else {
      console.warn('⚠️ Push event has no data');
      data = {
        title: 'iChat Notification',
        body: 'You have a new notification',
      };
    }
  } catch (error) {
    console.error('❌ Error processing push data:', error);
    // Fallback to default notification
    data = {
      title: 'iChat Notification',
      body: 'You have a new notification',
    };
  }

  const title = data.title || 'iChat Notification';

  // Show notification
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const isPageFocused = clientList.some(client => client.focused);
        const hasVisibleClients = clientList.length > 0;

        console.log('📱 Client status:', {
          hasClients: hasVisibleClients,
          clientCount: clientList.length,
          isPageFocused: isPageFocused,
        });

        // Check if sound is enabled (default to true if not specified)
        const soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        
        const options = {
          body: data.body || '',
          icon: data.icon || '/icon-192x192.png',
          badge: data.badge || '/badge-72x72.png',
          data: data.data || {},
          tag: data.tag || `ichat-${Date.now()}`, // Unique tag to prevent suppression
          // Always require interaction to ensure notification shows even when page is focused
          requireInteraction: true,
          silent: !soundEnabled, // Set silent based on user preference
          vibrate: soundEnabled ? [200, 100, 200] : undefined, // Only vibrate if sound is enabled
          timestamp: Date.now(),
        };

        console.log('📤 Attempting to show notification:', {
          title,
          body: options.body,
          tag: options.tag,
          requireInteraction: options.requireInteraction,
        });

        return self.registration.showNotification(title, options)
          .then(() => {
            console.log('✅ showNotification() promise resolved');
            console.log('📋 Notification should be visible now');
            console.log('💡 Note: If notification is not visible, check:');
            console.log('   1. Browser notification settings (Chrome: Settings > Privacy > Notifications)');
            console.log('   2. OS notification settings');
            console.log('   3. Browser "Do Not Disturb" mode');
            console.log('   4. Try minimizing the browser or switching tabs');

            // Notify clients that a notification was shown
            if (clientList.length > 0) {
              clientList.forEach(client => {
                try {
                  const postMessageResult = client.postMessage({
                    type: 'NOTIFICATION_SHOWN',
                    title,
                    body: options.body,
                    isPageFocused,
                  });
                  // postMessage may or may not return a Promise
                  if (postMessageResult && typeof postMessageResult.catch === 'function') {
                    postMessageResult.catch(err => {
                      console.warn('Could not notify client:', err);
                    });
                  }
                } catch (err) {
                  console.warn('Could not notify client:', err);
                }
              });
            }
          })
          .catch((error) => {
            console.error('❌ Error showing notification:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              code: error.code,
            });

            // Check permission status
            if (self.Notification) {
              const permission = self.Notification.permission;
              console.error('🔔 Notification permission status:', permission);
              if (permission !== 'granted') {
                console.error('⚠️ Notification permission is NOT granted!');
                console.error('   Please grant notification permission in browser settings.');
              }
            } else {
              console.error('⚠️ Notification API not available in service worker');
            }
          });
      })
      .catch((error) => {
        console.error('❌ Error getting clients:', error);
      })
  );
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  // Navigate to chat if chatId is available, otherwise to chats page
  let urlToOpen = '/chats';
  if (data.chatId) {
    urlToOpen = `/chats?chatId=${data.chatId}`;
  } else if (data.url) {
    urlToOpen = data.url;
  }

  console.log('🔗 Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function (clientList) {
      // Check if there's already a window open with the same origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.startsWith(self.location.origin)) {
          // Focus the existing window and send message to navigate
          client.focus();
          // Send message to client to navigate (handled by AppLayout)
          try {
            const postMessageResult = client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen,
              chatId: data.chatId,
              groupId: data.groupId,
            });
            // postMessage may or may not return a Promise
            if (postMessageResult && typeof postMessageResult.catch === 'function') {
              postMessageResult.catch(() => {
                // If postMessage fails, try to navigate directly
                if (client.navigate) {
                  client.navigate(urlToOpen);
                }
              });
            }
          } catch (err) {
            // If postMessage fails, try to navigate directly
            if (client.navigate) {
              client.navigate(urlToOpen);
            }
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  // You can track notification dismissals here if needed
  console.log('Notification closed:', event.notification.tag);
});

