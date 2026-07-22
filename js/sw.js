/**
 * Service Worker Avançado do BombonaCalc Pro
 * Estratégia: Cache-First (Performance Instantânea) com Fallback de Rede
 */

const CACHE_NAME = 'bombonacalc-v1.0.0';

// Lista de assets estáticos essenciais que serão cacheados imediatamente (App Shell)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/ui.js',
  './js/calculator.js',
  './js/storage.js',
  './js/utils.js',
  './manifest.json',
  './assets/favicon.ico'
];

// Evento de Instalação: Salva todo o esqueleto do app no Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-cacheando o App Shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Força o Service Worker atual a se tornar o ativo imediatamente
      return self.skipWaiting();
    })
  );
});

// Evento de Ativação: Limpa caches antigos para evitar conflitos de versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Garante que o SW controle a página atual imediatamente, sem precisar dar refresh
      return self.clients.claim();
    })
  );
});

// Evento de Interceptação de Requisições (Fetch)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam do tipo GET (como chamadas externas ou de extensão)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se o recurso estiver no cache, retorna imediatamente (Carregamento em 0ms)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Caso contrário, busca na rede externa
      return fetch(event.request).then((networkResponse) => {
        // Valida se a resposta da rede é legítima para salvar no cache dinamicamente
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback caso a rede falhe e o recurso não esteja em cache
        // Como o app é uma SPA completa rodando localmente, este cenário é mitigado.
        console.error('[Service Worker] Falha ao buscar recurso em modo offline.');
      });
    })
  );
});