(function () {
    'use strict';
    var API = 'https://newsapi.org/v2/';
    var CACHE_DATA = 'pwa-news-data-v1'
    var CACHE_SHELL = 'pwa-news-shell-v1';
    var FILES_SHELL = ['/',
        '/css/core.css',
        '/css/main.css',
        '/js/api.js',
        '/library/jquery-3.3.1.min.js',
        '/library/moment.min.js'
    ];

    var swPush;
    const applicationServerPublicKey = 'BC4KqvEK8QhWRgry5ZPGvCqH7aZT6BuffpDQEQYantfzP8SdIps9miJPhCjuquWMqLCZ3gfFjD8VAgF6yqksjI4';

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw-pwa-news.js').then(function (swRegister) {

                swPush = swRegister;
                console.log('Notification service worker is registered', swRegister);

                getSusbscription();

            }).catch(function (error) {
                console.log("Notification service worker error", error);
            });
        });
    } else {
        console.warn('Push messaging is not supported');
    }
    
    self.addEventListener('install', function (event) {
        event.waitUntil(
            self.caches.open(CACHE_SHELL).then(function (cache) {
                return cache.addAll(FILES_SHELL);
            })
        )
    });
    
    self.addEventListener('activate', function (event) {
        var cacheList = [CACHE_SHELL, CACHE_DATA];
        return event.waitUntil(
            self.caches.keys().then(function (cacheNames) {
                return Promise.all(cacheNames.map(function (cacheName) {
                    if (cacheList.indexOf(cacheName) === -1) {
                        self.caches.delete(cacheName);
                    }
                }))
            })
        )
    });

    self.addEventListener('fetch', function (event) {
        if (event.request.url.indexOf(API) === -1) {
            event.respondWith(
                caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response
                    }
                    return fetch(event.request);
                })
            )
        } else {
            event.respondWith(
                self.fetch(event.request)
                .then(function (response) {
                    return caches.open(CACHE_DATA)
                        .then(function (cache) {
                            cache.put(event.request.url, response.clone());
                            return response;
                        })
                }).catch(function () {
                    return caches.match(event.request);
                })
            )
        }
    })

    function getSusbscription() {
        if (swPush) {
            swPush.pushManager.getSubscription().then(function (subscription) {
                if (subscription) {

                    console.log('User is subscribed');
                } else {

                    console.log("User isn't subscribed");
                    registerUser();
                }
            });
        }
    }

    function registerUser() {
        const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
        swPush.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey}
        ).then(function (subscription) {

            console.log('User is subscribed:');
            console.log('Use this json on web-push-codelab.glitch.me to verify the notifications', JSON.stringify(subscription));

        }).catch(function (error) {

            console.log('Failed to subscribe the user: ', error);
        });
    }

    self.addEventListener('push', function (event) {

        console.log('[Service Worker] Push Received.');
        console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

        const title = 'PWA News';
        var options = {
            body: 'Venha conferir as novidades',
            icon: 'images/favicon.ico',
            badge: 'images/favicon.ico'
        };

        const notificationPromise = self.registration.showNotification(title, options);
        event.waitUntil(notificationPromise);
    });

    self.addEventListener('notificationclick', function (event) {
        event.notification.close();

        event.waitUntil(clients.openWindow('https://news.google.com.br'));
    });

    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }

}());