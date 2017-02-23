const DEBUG = false;

/**
 * When the user navigates to your site,
 * the browser tries to redownload the script file that defined the service worker in the background.
 * If there is even a byte's difference in the service worker file compared to what it currently has,
 * it considers it 'new'.
 */
const version = '5.2.3';

const { assets } = global.serviceWorkerOption;

const CACHE_NAME = version + (new Date).toISOString();

let assetsToCache = [
  ...assets,
  './',
  '/assets/songkick-logo--black.svg',
  '/assets/songkick-logo--white.svg'
];

assetsToCache = assetsToCache.map((path) => {
  return new URL(path, global.location).toString();
});

// When the service worker is first added to a computer.
self.addEventListener('install', (event) => {
  // Perform install steps.
  if (DEBUG) {
    console.info('[SW] Install event');
  }

  // Add core website files to cache during serviceworker installation.
  event.waitUntil(
    global.caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(assetsToCache);
      })
      .then(() => {
        if (DEBUG) {
          console.info('Cached assets: main', assetsToCache);
        }
      })
      .catch((error) => {
        console.error(error);
        throw error;
      })
  );
});

// After the install event.
self.addEventListener('activate', (event) => {
  if (DEBUG) {
    console.info('[SW] Activate event');
  }

  // Clean the caches
  event.waitUntil(
    global.caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete the caches that are not the current one.
            if (cacheName.indexOf(CACHE_NAME) === 0) {
              return null;
            }
            return global.caches.delete(cacheName);
          })
        );
      })
  );
});

self.addEventListener('message', (event) => {
  switch (event.data.action) {
  case 'skipWaiting':
    if (self.skipWaiting) {
      self.skipWaiting();
    }
    break;
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore not GET request.
  if (request.method !== 'GET') {
    if (DEBUG) {
      console.info(`[SW] Ignore non GET request ${request.method}`);
    }
    return;
  }

  const requestUrl = new URL(request.url);

  // Ignore API calls
  if (requestUrl.pathname.includes('/api/')) {
    if (DEBUG) {
      console.info(`[SW] Ignore API calls`);
    }
    return;
  }

  // Ignore difference origin.
  if (requestUrl.origin !== location.origin) {
    if (DEBUG) {
      console.info(`[SW] Ignore difference origin ${requestUrl.origin}`);
    }
    return;
  }

  const resource = global.caches.match(request)
  .then((response) => {
    if (response) {
      if (DEBUG) {
        console.info(`[SW] fetch URL ${requestUrl.href} from cache`);
      }

      return response;
    }

    // Load and cache known assets.
    return fetch(request)
      .then((responseNetwork) => {
        if (!responseNetwork || !responseNetwork.ok) {
          if (DEBUG) {
            console.info(`[SW] URL [${
              requestUrl.toString()}] wrong responseNetwork: ${responseNetwork.status} ${responseNetwork.type}`);
          }

          return responseNetwork;
        }

        if (DEBUG) {
          console.info(`[SW] URL ${requestUrl.href} fetched`);
        }

        const responseCache = responseNetwork.clone();

        global.caches
          .open(CACHE_NAME)
          .then((cache) => {
            return cache.put(request, responseCache);
          })
          .then(() => {
            if (DEBUG) {
              console.info(`[SW] Cache asset: ${requestUrl.href}`);
            }
          });

        return responseNetwork;
      })
      .catch(() => {
        // User is landing on our page.
        if (event.request.mode === 'navigate') {
          return global.caches.match('./');
        }

        return null;
      });
  });

  event.respondWith(resource);
});

// when the user clicks the notif
self.addEventListener('notificationclick', event => {
  event.notification.close(); // android needs explicit close.

  if (event.action) {
    // could do something with the action in the future
  }

  // open any uri is available
  if (event.notification.data && event.notification.data.uri) {
    event.waitUntil(
      clients.openWindow(event.notification.data.uri)
    );
  }
});

self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});
