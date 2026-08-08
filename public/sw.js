// Intentionally minimal. Prices, the checklist, and weight logs are all
// live data — aggressive offline caching would just serve stale numbers,
// which is worse than no caching for this app. This exists to satisfy
// "is a service worker registered" installability checks and leaves room
// to add real asset caching later without redesigning anything.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let every request go to the network as normal.
});
