// Service Worker for DSA Practice App Notifications
const CACHE_NAME = 'dsa-practice-v1';
const NOTIFICATION_TAG = 'dsa-daily-reminder';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    clients.claim().then(() => {
      // Set up periodic background sync for notifications
      setupPeriodicNotifications();
    })
  );
});

// Setup periodic notifications
async function setupPeriodicNotifications() {
  try {
    // Register for periodic background sync (if supported)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('📅 Setting up periodic notifications...');
      
      // Check for professional notifications every minute
      setInterval(() => {
        checkProfessionalNotifications();
      }, 60000); // Check every minute
    }
  } catch (error) {
    console.log('⚠️ Periodic sync not supported:', error);
  }
}

// Check for professional notifications
async function checkProfessionalNotifications() {
  try {
    const settings = await getNotificationSettings();
    if (!settings || !settings.enabled || !settings.dailyReminder) {
      return;
    }
    
    // Build professional schedule from user settings
    const PROFESSIONAL_SCHEDULE = [
      { time: settings.morningStartTime || '09:00', type: 'morning_start', priority: 'high' },
      { time: settings.afternoonBoostTime || '14:00', type: 'afternoon_boost', priority: 'medium' },
      { time: settings.eveningPracticeTime || '18:00', type: 'evening_practice', priority: 'high' }
    ];
    
    // Add night reflection if enabled
    if (settings.enableNightReflection !== false) {
      PROFESSIONAL_SCHEDULE.push({ 
        time: settings.nightReflectionTime || '21:00', 
        type: 'night_review', 
        priority: 'low' 
      });
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    // Check each professional notification time
    for (const schedule of PROFESSIONAL_SCHEDULE) {
      if (currentTime === schedule.time) {
        // Skip low priority notifications on weekday nights
        if (schedule.priority === 'low' && isWeekday && now.getHours() >= 22) {
          continue;
        }
        
        const notificationKey = `${schedule.type}_${today}`;
        const lastNotificationDate = await getLastNotificationDate(notificationKey);
        
        // Only send notification once per day for each type
        if (lastNotificationDate !== today) {
          await showProfessionalNotification(schedule.type);
          await setLastNotificationDate(notificationKey, today);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking professional notifications:', error);
  }
}

// Get notification settings from storage
async function getNotificationSettings() {
  try {
    // Try to get from IndexedDB or use postMessage to main thread
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to get settings
      clients[0].postMessage({ type: 'GET_NOTIFICATION_SETTINGS' });
    }
    
    // Fallback to default settings
    return {
      enabled: true,
      dailyReminder: true,
      reminderTime: '09:00',
      streakReminder: true,
      motivationalMessages: true,
      // Professional schedule defaults
      morningStartTime: '09:00',
      afternoonBoostTime: '14:00',
      eveningPracticeTime: '18:00',
      nightReflectionTime: '21:00',
      enableNightReflection: true
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return null;
  }
}

// Get last notification date (with key support for multiple notifications)
async function getLastNotificationDate(key = 'default') {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`/last-notification-date-${key}`);
    if (response) {
      return await response.text();
    }
  } catch (error) {
    console.error('Error getting last notification date:', error);
  }
  return null;
}

// Set last notification date (with key support for multiple notifications)
async function setLastNotificationDate(key, date) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(`/last-notification-date-${key}`, new Response(date));
  } catch (error) {
    console.error('Error setting last notification date:', error);
  }
}

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(showDailyReminderNotification());
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle different notification actions
  if (event.action === 'solve') {
    event.waitUntil(
      clients.openWindow('/problems')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Show professional notification based on type
async function showProfessionalNotification(type) {
  try {
    const userProgress = await getUserProgressFromStorage();
    
    let title = "DSA Practice";
    let body = "";
    
    switch (type) {
      case 'morning_start':
        title = "Good Morning! 🌅";
        if (userProgress.solvedToday > 0) {
          body = `Great start! You've already solved ${userProgress.solvedToday} problems today. Keep the momentum going!`;
        } else {
          body = "Start your day strong with some problem-solving practice. Your future self will thank you!";
        }
        break;
        
      case 'afternoon_boost':
        title = "Afternoon Focus Time 🎯";
        if (userProgress.solvedToday > 0) {
          body = `Excellent progress! ${userProgress.solvedToday} problems completed. Ready for an afternoon challenge?`;
        } else {
          body = "Perfect time for a productive coding session. Even 20 minutes can make a difference!";
        }
        break;
        
      case 'evening_practice':
        title = "Evening Practice Session 🌆";
        if (userProgress.solvedToday >= 3) {
          body = `Outstanding day! ${userProgress.solvedToday} problems solved. Consider reviewing or tackling one more?`;
        } else if (userProgress.solvedToday > 0) {
          body = `Good work today! ${userProgress.solvedToday} problems down. How about one more before dinner?`;
        } else {
          body = "End your day productively with some algorithm practice. Your skills compound daily!";
        }
        break;
        
      case 'night_review':
        title = "Night Reflection 🌙";
        if (userProgress.solvedToday > 0) {
          body = `Well done today! ${userProgress.solvedToday} problems completed. Tomorrow's another opportunity to grow!`;
        } else {
          body = "Tomorrow is a fresh start for your coding journey. Set yourself up for success!";
        }
        break;
        
      default:
        body = "Time for your DSA practice session!";
    }
    
    // Add streak information for motivation
    if (userProgress.currentStreak > 0 && type !== 'night_review') {
      body += ` Your ${userProgress.currentStreak}-day streak is impressive! 🔥`;
    }
    
    const options = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `professional-${type}`,
      requireInteraction: false,
      data: {
        url: '/problems'
      }
    };

    await self.registration.showNotification(title, options);
    console.log(`✅ Professional notification shown: ${type}`);
  } catch (error) {
    console.error('❌ Error showing professional notification:', error);
  }
}

// Get user progress from storage
async function getUserProgressFromStorage() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Since we can't access localStorage directly in service worker,
    // we'll use a default structure
    return {
      solvedToday: 0,
      currentStreak: 0,
      totalSolved: 0
    };
  } catch (error) {
    return { solvedToday: 0, currentStreak: 0, totalSolved: 0 };
  }
}

// Handle push events (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('📨 Push message received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'push-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle background fetch (optional - for offline support)
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for the app
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return a simple offline page with system theme
        return new Response(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <title>DSA Practice - Offline</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: #f7fafc;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
                  color: #2d3748;
                }
                
                .container {
                  background: white;
                  padding: 2rem;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                  text-align: center;
                  max-width: 400px;
                  width: 90%;
                }
                
                .icon {
                  font-size: 3rem;
                  margin-bottom: 1rem;
                }
                
                .title {
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-bottom: 0.5rem;
                }
                
                .message {
                  color: #718096;
                  margin-bottom: 1.5rem;
                }
                
                .retry-btn {
                  background: #4299e1;
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 8px;
                  font-size: 0.9rem;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background 0.2s;
                }
                
                .retry-btn:hover {
                  background: #3182ce;
                }
                
                /* Dark theme styles */
                @media (prefers-color-scheme: dark) {
                  body {
                    background: #1a202c;
                    color: #f7fafc;
                  }
                  
                  .container {
                    background: #2d3748;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                  }
                  
                  .message {
                    color: #a0aec0;
                  }
                  
                  .retry-btn {
                    background: #4299e1;
                  }
                  
                  .retry-btn:hover {
                    background: #63b3ed;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">🌐</div>
                <h1 class="title">You're Offline</h1>
                <p class="message">Please check your internet connection and try again.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                  🔄 Retry
                </button>
              </div>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
  }
});
