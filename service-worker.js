'use strict';

function timeoutPromise(ms, promise, controller) {
    return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            timeoutId = undefined;
            controller.abort();
            reject(new Error("promise timeout"));
        }, ms);
        promise.then(
            (res) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    resolve(res);
                }
            },
            (err) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    reject(err);
                }
            }
        );
    })
};
const nonuse = 40;
const FETCH_TIMEOUT = 4000;
const FETCH_TIMEOUT_IMG = 12000;
const STATIC_CACHE = "static-cache-v20";
const DYNAMIC_CACHE = "dynamic-cache-v20";

const STATIC_CACHE_FILES = [
    './',
    './build/main.js',
    './build/vendor.js',
    './build/main.css',
    './assets/css/animate.min.css',
    './build/polyfills.js',
    './index.html',
    './manifest.json',
    './assets/fonts/ionicons.ttf',
    './assets/fonts/ionicons.woff?v=3.0.0-alpha.3',
    './assets/fonts/ionicons.woff2?v=3.0.0-alpha.3',
    './assets/fonts/roboto-medium.woff2',
    './assets/fonts/roboto-regular.ttf',
    './assets/fonts/roboto-regular.woff2',
    './assets/fonts/roboto-bold.ttf',
    './assets/fonts/roboto-bold.woff2',
    './assets/icon/pa-favicon.png',
    './assets/imgs/noimagebg.png',
    './assets/imgs/logo.png',
    './assets/scripts/pjxml.js',
    './assets/scripts/NoSleep.min.js',
    './assets/scripts/granim.min.js',
    './assets/icons/icon-144x144.png',
    './assets/icon/icono152x152.jpg',
    './assets/icon/icono180x180.jpg',
    './assets/icon/icono167x167.jpg',
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-96x96.png',
    './assets/icons/icon-128x128.png',
    './assets/icons/icon-152x152.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-384x384.png',
    './assets/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css?family=Oswald',
    'https://fonts.gstatic.com/s/oswald/v16/TK3iWkUHHAIjg752HT8Gl-1PK62t.woff2',
    'https://fonts.gstatic.com/s/oswald/v16/TK3iWkUHHAIjg752GT8Gl-1PKw.woff2',
    './assets/fonts/fontawesome-webfont.woff2?v=4.7.0',
    './assets/imgs/youtube.png',
    './assets/fonts/Oswald-Regular.ttf',
    './assets/scripts/stencil/wp-components.js',
    './assets/scripts/stencil/wp-components/7nanmvyv.entry.js',
    './assets/scripts/stencil/wp-components/7nanmvyv.es5.entry.js',
    './assets/scripts/stencil/wp-components/7nanmvyv.sc.entry.js',
    './assets/scripts/stencil/wp-components/7nanmvyv.sc.es5.entry.js',
    './assets/scripts/stencil/wp-components/wp-components.registry.json',
    './assets/scripts/stencil/wp-components/wp-components.sg1vcl3w.js',
    './assets/scripts/stencil/wp-components/wp-components.vvvimcem.js',
    './assets/css/bootstrap-grid.min.css'
];

const DYNAMIC_CACHE_FILES = [
    './assets/data/artistas.json',
    './assets/data/horarios.json',
    'https://portamerica.es/wp-json/wp/v2/posts?_embed&per_page=10&offset=0'
];

self.addEventListener('install', function(e) {
    e.waitUntil(Promise.all([
        caches.open(STATIC_CACHE).then(function(cache) {
            return cache.addAll(STATIC_CACHE_FILES);
        }),
        caches.open(DYNAMIC_CACHE).then(function(cache) {
            return cache.addAll(DYNAMIC_CACHE_FILES);
        })
    ]));
});

self.addEventListener('activate', event => {
    self.clients.claim();
    console.log(STATIC_CACHE, DYNAMIC_CACHE, ' now activated');
});

self.addEventListener('message', (e) => {
    if (e.data.updateSw) {
        self.caches.keys().then(cacheNames => {
            for (let i = 0; i < cacheNames.length; i++) {
                if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheNames[i])) {
                    self.caches.delete(cacheNames[i]);
                }
            }
            self.skipWaiting();
        });
    }
});

self.addEventListener('fetch', function(e) {
    console.log(e.request.url);
    if (e.request.url.startsWith('https://portamerica.es/wp-json/wp/v2/posts') ||
        e.request.url.startsWith('http://portamerica.es/wp-json/wp/v2/posts') ||
        e.request.url.endsWith('/assets/data/artistas.json') ||
        e.request.url.endsWith('/assets/data/horarios.json')) {
        console.log('network then cache');
        const controller = new AbortController();
        const signal = controller.signal;
        e.respondWith(
            timeoutPromise(FETCH_TIMEOUT, fetch(e.request, { signal }), controller).then(resp => {
                if (resp.ok) {
                    caches.open(DYNAMIC_CACHE).then(function(cache) {
                        return cache.put(e.request, resp.clone());
                    });
                    return resp.clone();
                } else {
                    return caches.match(e.request).then(response => {
                        if (response)
                            return response;
                        return null;
                    });
                }
            }).catch(err => {
                return caches.match(e.request).then(response => {
                    if (response)
                        return response;
                    return null;
                });
            })
        );
    } else if (e.request.url.startsWith('https://portamerica.es/wp-content/uploads/') ||
        e.request.url.startsWith('http://portamerica.es/wp-content/uploads/') ||
        e.request.url.startsWith('https://portamerica.es/app/') ||
        e.request.url.startsWith('http://portamerica.es/app/')) {
        console.log('network then fail img');
        const controller = new AbortController();
        const signal = controller.signal;
        e.respondWith(
            timeoutPromise(FETCH_TIMEOUT_IMG, fetch(e.request, { signal }), controller).then(resp => {
                if (resp) {
                    return resp.clone();
                } else {
                    return caches.match('./assets/imgs/noimagebg.png').then(function(response) {
                        if (response)
                            return response;
                        else
                            return null;
                    });
                }
            }).catch(err => {
                return caches.match('./assets/imgs/noimagebg.png').then(function(response) {
                    if (response)
                        return response;
                    else
                        return null;
                });
            })
        );
    } else if (STATIC_CACHE_FILES.map(item => (item.startsWith('./') ? item.substring(2) : item)).some(itemS => (itemS.length > 0 && e.request.url.endsWith(itemS)))) {
        console.log('cache first');
        e.respondWith(
            caches.match(e.request).then(function(response) {
                if (response) {
                    return response;
                } else
                    return fetch(e.request).then(res => {
                        caches.open(STATIC_CACHE).then(function(cache) {
                            return cache.put(e.request, res.clone());
                        });
                        return res.clone();
                    });
            }).catch(err => {

            })
        );
    } else if (e.request.url.includes('/#/') || e.request.url.replace(self.location.origin, '') == '/') {
        console.log('index');
        e.respondWith(
            caches.match('./').then(function(response) {
                if (response) {
                    return response;
                } else
                    return fetch('./').then(res => {
                        caches.open(STATIC_CACHE).then(function(cache) {
                            return cache.put('./', res.clone());
                        });
                        return res.clone();
                    });
            }).catch(err => {

            })
        );
    } else {
        console.log('network');
        e.respondWith(fetch(e.request));
    }
});