// Custom service worker for push notifications
// This file is separate from the vite-pwa generated SW

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, url, timestamp } = data;

  const options = {
    body: body || "You have a new notification",
    icon: icon || "/pwa-icon-192.png",
    badge: badge || "/pwa-icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: url || "/" },
    timestamp: timestamp || Date.now(),
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    tag: `pgbuddy-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title || "PG Buddy", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if found
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
