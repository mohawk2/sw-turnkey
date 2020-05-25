/* https://github.com/mohawk2/sw-turnkey */
(function() {
  var configURL = "serviceworker-config.json";
  var cachename = "myAppCache"; // if in config, can't work offline as not know which cache to fetch/store config

  function jsonCachingFetch(request) {
    return caches.match(request).then(cacheResponse => {
      var cF = cachingFetch(request); // revalidate, but return cached if true
      return cacheResponse || cF;
    }).then(response => response.json()).catch(e => {
      console.log('Error getting config:', e);
      throw e;
    });
  }

  function cachingFetch(request) {
    return fetch(request).then(networkResponse => {
      var nrClone = networkResponse.clone(); // capture here else extra ticks will make body be read by time get to inner .then
      if (networkResponse.ok) {
        caches.open(cachename).then(
          cache => cache.put(request, nrClone)
        ).catch(()=>{}); // caching error, typically from eg POST
      }
      return networkResponse;
    });
  }

  function cachingFetchOrCached(request, cacheResponse) {
    return cachingFetch(request).then(
      response => response.ok ? response : cacheResponse
    ).catch(error => cacheResponse);
  }

  function maybeMatch(configObj, key, value) {
    return configObj[key] && value.match(configObj[key].re);
  }

  self.addEventListener("install", event => {
    console.log("Installing SW...");
    var configObj, request = new Request(configURL);
    event.waitUntil(caches.keys().then(
      ks => Promise.all(ks.map(k => caches.open(k)))
    ).then(
      cs => Promise.all(cs.map(c => c.delete(request)))
    ).then(() => jsonCachingFetch(request)).then(response => {
      configObj = response;
      return caches.open(cachename);
    }).then(cache => {
      console.log("Caching: ", configObj.precache_urls);
      return cache.addAll(configObj.precache_urls);
    }).then(() => console.log("The SW is now installed")));
  });

  self.addEventListener("fetch", event => {
    var url = event.request.url;
    event.respondWith(jsonCachingFetch(configURL).then(response => {
      var configObj = response;
      if (maybeMatch(configObj, 'network_only', url)) {
        if (configObj.debug) console.log('network_only', url);
        return fetch(event.request).catch(() => {});
      }
      return caches.open(cachename).then(
        cache => cache.match(event.request)
      ).then(cacheResponse => {
        if (cacheResponse && maybeMatch(configObj, 'cache_only', url)) {
          if (configObj.debug) console.log('cache_only', url);
          return cacheResponse;
        }
        if (maybeMatch(configObj, 'network_first', url)) {
          if (configObj.debug) console.log('network_first', url);
          return cachingFetchOrCached(event.request, cacheResponse);
        }
        if (configObj.debug) console.log('cache_first', url);
        return cacheResponse || cachingFetch(event.request).catch(() => {});
      });
    }));
  });
})();
