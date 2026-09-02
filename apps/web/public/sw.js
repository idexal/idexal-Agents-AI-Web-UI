/**
 * Service Worker for Idexal Agents
 * Provides offline caching and background sync
 */

const CACHE_NAME = 'idexal-agents-v1'
const STATIC_CACHE_NAME = 'idexal-agents-static-v1'
const DYNAMIC_CACHE_NAME = 'idexal-agents-dynamic-v1'

// Assets to pre-cache for offline use
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-16.png',
  '/icon-32.png',
  '/icon-48.png',
  '/icon.png',
  '/logo.png',
]

// Network timeout for dynamic requests
const NETWORK_TIMEOUT = 10000

/**
 * Install event - pre-cache static assets.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

/**
 * Activate event - clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

/**
 * Fetch event - serve from cache or network.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle static assets - cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle API requests - network first with cache fallback
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithTimeout(request))
    return
  }

  // Handle navigation - network first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request))
})

/**
 * Cache-first strategy for static assets.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network-first strategy with timeout for API requests.
 */
async function networkFirstWithTimeout(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      ),
    ])

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Network-first strategy for navigation.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    // Return offline page
    return caches.match('/')
  }
}

/**
 * Stale-while-revalidate strategy.
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE_NAME).then((c) => {
        c.put(request, response.clone())
      })
    }
    return response
  }).catch(() => cached)

  return cached || fetchPromise
}

/**
 * Check if URL is a static asset.
 */
function isStaticAsset(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase()
  return ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'].includes(ext || '')
}

/**
 * Check if URL is an API request.
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

/**
 * Background sync event handler.
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-conversations') {
    event.waitUntil(syncConversations())
  }
})

/**
 * Sync offline conversations to server.
 */
async function syncConversations() {
  // Notify all clients that sync is starting
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_START' })
  })

  try {
    // Get unsynced conversations from IndexedDB
    const db = await openDB()
    const transaction = db.transaction('conversations', 'readonly')
    const store = transaction.objectStore('conversations')
    const index = store.index('synced')
    const request = index.getAll(0)

    const unsynced = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    // Sync each conversation
    for (const conversation of unsynced) {
      try {
        const response = await fetch('/api/conversations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversation),
        })

        if (response.ok) {
          await markAsSynced(db, conversation.id)
        }
      } catch (error) {
        console.error('Failed to sync conversation:', conversation.id, error)
      }
    }

    // Notify all clients that sync is complete
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', synced: unsynced.length })
    })
  } catch (error) {
    console.error('Sync failed:', error)
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_ERROR', error: error.message })
    })
  }
}

/**
 * Open IndexedDB database.
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('idexal-offline', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Mark a conversation as synced in IndexedDB.
 */
async function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversations', 'readwrite')
    const store = transaction.objectStore('conversations')
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const conversation = getReq.result
      if (conversation) {
        conversation.synced = true
        conversation.messages = conversation.messages.map((msg) => ({ ...msg, synced: true }))
        store.put(conversation)
      }
      resolve()
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/**
 * Push notification event handler.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Idexal Agents', options)
  )
})

/**
 * Notification click handler.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  )
})
