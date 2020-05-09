# sw-turnkey

## Introduction

Do *you* want to take advantage of the new(ish) Service Worker
functionality?

Would *you* like your website to be able to work offline, and to
control what's cached?

Have *you* read up on Service Workers and thought it seems very powerful, but a huge learning curve?

Would *you* like to just be able to drop a couple of files onto your
website, configure a JSON file, add one line to your HTML, and go?

**HELP IS AT HAND**

## How to use these files

* Drop `serviceworker-install.js` and `serviceworker.js` at the top level of your app, so that its "scope" covers the whole app

* Add this line to all your HTML (maybe adjusting for location):

```
<script src="serviceworker-install.js"></script>
```

* Edit `serviceworker-config.json` for your needs and put it in the
same location

* Er...

* That's it

## Configuration

The content of `serviceworker-config.json` is a JSON-encoded hash (or
"object"). Its keys, and the values for them:

* `precache_urls`

Array of URLs to precache when the service worker is installed.

* `network_only` - don't cache at all

* `cache_only` - once cached, never look up again

* `network_first` - fetch from the network; if that fails, return cached

The values of these are all hashes with currently one key, "re" - a
regular expression. A fetched URL is checked against each in the above
order. When it matches, it will use that strategy. If none match, will
fall back to cache first (aka "stale while revalidate").

## Example 1: Single-Page App

See in the supplied directory `sample-app` for the actual files.

Imagine you have a single-page app (SPA) with a button that you click
and it says "Hi". You want that to work offline!

`index.html` before:

```
<!doctype html>
<body>
<input type=button onclick="alert('Hi')" value="Say Hi" />
</body>
```

To make this available offline, and generally be fast, we will use the
default cache first strategy, together with pre-caching.

To use `sw-turnkey` here, drop `serviceworker-install.js` and
`serviceworker.js` into the same directory as `index.html`.
Also place `serviceworker-config.json` with these contents:

```
{
  "precache_urls": [
    "",
    "serviceworker-install.js",
    "serviceworker.js",
    "serviceworker-config.json"
  ]
}
```

`index.html` after:

```
<!doctype html>
<script src="serviceworker-install.js"></script>
<body>
<input type=button onclick="alert('Hi')" value="Say Hi" />
</body>
```

## Example 2: Single-Page App with dynamic component

Imagine you have a single-page app (SPA) with a button that you click
and it loads dynamically-generated content from your website. You want
that to load fast, but you don't want to cache that generated content,
and you don't mind it not working offline.

`index.html` before:

```
<!doctype html>
<body>
<a href="dynamic.cgi" target="iframe">Load</a>
<br />
<iframe name=iframe></iframe>
</body>
```

You'll need to add the same `serviceworker.js` and `serviceworker-install.js`.

For most of this content, the default cache first strategy,
together with pre-caching works well, but we'll also use `network_only`
for `dynamic.cgi`. So we'll use this `serviceworker-config.json`:

```
{
  "precache_urls": [
    "",
    "serviceworker-install.js",
    "serviceworker.js",
    "serviceworker-config.json"
  ],
  "network_only": {
    "re": "dynamic\\.cgi.*"
  }
}
```

`index.html` after:

```
<!doctype html>
<script src="serviceworker-install.js"></script>
<body>
<a href="dynamic.cgi" target="iframe">Load</a>
<br />
<iframe name=iframe></iframe>
</body>
```
