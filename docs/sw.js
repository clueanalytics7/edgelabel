/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "translation.html",
    "revision": "18a2abe6e4d54633824cc0895af53d14"
  }, {
    "url": "security-architecture.html",
    "revision": "cf08cb628674828deb2c4fcf7660e3b2"
  }, {
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "c101fc8915c796be068bed21dd745011"
  }, {
    "url": "pwa-512x512.png",
    "revision": "c101fc8915c796be068bed21dd745011"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0dc20d3e48586ed70423a79373c6cc33"
  }, {
    "url": "privacy.html",
    "revision": "a6016db9ba36e5a908463fdf97e7f8f9"
  }, {
    "url": "index.html",
    "revision": "4ba6adf7936b769c7319afdf65c3f0f9"
  }, {
    "url": "image-annotation.html",
    "revision": "0323c02aac5bd8d1152cbaa368c21f1e"
  }, {
    "url": "icon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "guide.html",
    "revision": "1321fd625262fe2076594db44bc4a935"
  }, {
    "url": "favicon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "contact.html",
    "revision": "0d309e31dfe1ce00a38f7896245bf4d4"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f2b5b280c8e91601653cbf5df738708d"
  }, {
    "url": "annotation.html",
    "revision": "dbf362f3b55f5f6d7693c7b721713c97"
  }, {
    "url": "about.html",
    "revision": "f09e7d6bf857b2e4b0d2511b7684defb"
  }, {
    "url": "404.html",
    "revision": "34d7f628a359482d4235a586a433cc28"
  }, {
    "url": "samples/translation-support.csv",
    "revision": "2706b0fceabe8fa71dc350fbf8d7dcf0"
  }, {
    "url": "samples/sentiment-reviews.csv",
    "revision": "915fc6302335bc6a83170ead2d0c3fe8"
  }, {
    "url": "samples/medical-ner.csv",
    "revision": "f796da98f6c56487d70c5958de2f0b10"
  }, {
    "url": "images/translation_image.png",
    "revision": "6e6e4ed6a3a3f774ab0fba21124024b4"
  }, {
    "url": "images/annotation_image.png",
    "revision": "c70a5ee39914c82e35914e519ceefa82"
  }, {
    "url": "assets/translation-CDnOlJ8e.js",
    "revision": null
  }, {
    "url": "assets/input-BP3W71qx.css",
    "revision": null
  }, {
    "url": "assets/imageAnnotation-CLeKmUns.js",
    "revision": null
  }, {
    "url": "assets/favicon-B3Ar59hU.svg",
    "revision": null
  }, {
    "url": "assets/annotation-CwfeMkiy.js",
    "revision": null
  }, {
    "url": "assets/PWAInstallButton-CO3hcDWU.js",
    "revision": null
  }, {
    "url": "assets/FileComponents-CdNQQnBC.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f2b5b280c8e91601653cbf5df738708d"
  }, {
    "url": "favicon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "icon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0dc20d3e48586ed70423a79373c6cc33"
  }, {
    "url": "pwa-512x512.png",
    "revision": "c101fc8915c796be068bed21dd745011"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "c101fc8915c796be068bed21dd745011"
  }, {
    "url": "manifest.webmanifest",
    "revision": "80cf19a4f76a0c12ab8569c63c03788b"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
