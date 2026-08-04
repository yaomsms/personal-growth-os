// Service Worker - 成长OS 离线缓存
const CACHE_NAME = 'growth-os-cache-v1';
const CACHE_VERSION = 'v1.0.0';

// 需要缓存的静态资源列表
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/modules.css',
  './js/data.js',
  './js/storage.js',
  './js/app.js',
  './js/modules/dashboard.js',
  './js/modules/habits.js',
  './js/modules/english.js',
  './js/modules/pr.js',
  './js/modules/ai.js',
  './js/modules/drawing.js',
  './js/modules/finance.js',
  './js/modules/health.js',
  './js/modules/diet.js',
  './js/modules/todo.js',
  './js/modules/attendance.js',
  './js/modules/mood.js',
  './js/modules/questions.js',
  './js/modules/makeup.js',
  './js/modules/analytics.js',
  './js/modules/review.js',
  './js/modules/schedule.js',
  './js/modules/tools.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// 安装阶段 - 缓存所有静态资源
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] 安装中，版本:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] 缓存静态资源');
        // 缓存所有资源，即使某个失败也继续
        return Promise.all(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn('[ServiceWorker] 缓存失败:', url, err);
            })
          )
        );
      })
      .then(() => {
        console.log('[ServiceWorker] 安装完成');
        return self.skipWaiting(); // 立即激活新的SW
      })
      .catch((err) => {
        console.error('[ServiceWorker] 安装失败:', err);
      })
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[ServiceWorker] 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] 激活完成');
        return self.clients.claim(); // 立即控制所有页面
      })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // 只缓存 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 对于导航请求，使用网络优先策略
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功获取到新页面，更新缓存
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 网络失败，返回缓存中的 index.html
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 对于其他资源，使用缓存优先策略
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // 缓存命中，返回缓存
          return cachedResponse;
        }
        
        // 缓存未命中，发起网络请求
        return fetch(request)
          .then((networkResponse) => {
            // 如果响应有效，添加到缓存
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // 网络失败，返回适当的回退
            console.warn('[ServiceWorker] 网络请求失败，无缓存可用:', request.url);
            return new Response('离线状态，无法加载此资源', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// 接收来自页面的消息
self.addEventListener('message', (event) => {
  const { type } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      cacheName: CACHE_NAME
    });
  }
  
  if (type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(name => caches.delete(name));
    });
    event.ports[0].postMessage({ success: true });
  }
});

console.log('[ServiceWorker] 已加载，版本:', CACHE_VERSION);
