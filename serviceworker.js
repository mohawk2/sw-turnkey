/* https://github.com/mohawk2/sw-turnkey */
(function() {
  var configURL = "serviceworker-config.json";
  var cachename = "myAppCache"; // if in config, can't work offline as not know which cache to fetch/store config

  function makeFetchConfigPromise(url) {
    var request = new Request(url);
    return caches.match(request).then(function(cacheResponse) {
      return makeNetworkFirstPromise(request, cacheResponse);
    }).then(function(response) {
      return response.json();
    }).catch(function(e) {
      console.log('Error getting config:', e);
      throw e;
    });
  }

  function makeFetchCachePromise(request) {
    return fetch(request).then(function (networkResponse) {
      var nrClone = networkResponse.clone();
      if (networkResponse.ok) {
        caches.open(cachename).then(function(cache) {
          return cache.put(request, nrClone);
        });
      }
      return networkResponse;
    });
  }

  function makeNetworkFirstPromise(request, cacheResponse) {
    var originalResponse;
    return makeFetchCachePromise(request).then(function(response) {
      if (response.ok) return response;
      originalResponse = response;
      throw "Error";
    }).catch(function(error) {
      if (cacheResponse) return cacheResponse;
      return originalResponse;
    });
  }

  function maybeMatch(configObj, key, value) {
    return configObj[key] && value.match(configObj[key].re);
  }

  self.addEventListener("install", function(event) {
    console.log("Installing SW...");
    var configObj;
    event.waitUntil(makeFetchConfigPromise(configURL).then(function(response) {
      configObj = response;
      return caches.open(cachename);
    }).then(function(cache) {
      console.log("Caching: ", configObj.precache_urls);
      return cache.addAll(configObj.precache_urls);
    }).then(function() {
      console.log("The SW is now installed");
    }));
  });

  self.addEventListener("fetch", function(event) {
    event.respondWith(makeFetchConfigPromise(configURL).then(function(response) {
      var configObj = response;
      if (maybeMatch(configObj, 'network_only', event.request.url)) {
        return fetch(event.request).catch(function() {});
      }
      return caches.match(event.request).then(function(cacheResponse) {
        if (cacheResponse && maybeMatch(configObj, 'cache_no_revalidate', event.request.url)) {
          return cacheResponse;
        }
        if (maybeMatch(configObj, 'network_first', event.request.url)) {
          return makeNetworkFirstPromise(event.request, cacheResponse);
        }
        return cacheResponse || makeFetchCachePromise(event.request).catch(function() {});
      });
    }));
  });
})();
