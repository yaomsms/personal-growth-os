// Service Worker - 成长OS 离线缓存
const CACHE_NAME = 'growth-os-cache-v2';
const CACHE_VERSION = 'v2.0.0';

// 需要缓存的静态资源列表
const STATIC_ASSETS = [
  './',
  './single-file.html',
  './index.html',
  './login.html',
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
        return self.skipWaiting();
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
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;
  
  // 跳过 API 请求（Supabase 等）
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果缓存中有，直接返回缓存
        if (cachedResponse) {
          // 后台更新缓存（如果是同源资源）
          if (url.origin === location.origin) {
            fetch(event.request)
              .then((response) => {
                if (response && response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, responseClone);
                    });
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }
        
        // 如果缓存中没有，从网络获取
        return fetch(event.request)
          .then((response) => {
            // 只缓存同源的成功响应
            if (response && response.status === 200 && url.origin === location.origin) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // 网络失败时，对于导航请求，返回单文件版
            if (event.request.mode === 'navigate') {
              return caches.match('./single-file.html');
            }
            return null;
          });
      })
  );
});

// 接收来自客户端的消息
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
