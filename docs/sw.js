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
    "revision": "8c0d31f22227c2f0f8bd5165fc47225f"
  }, {
    "url": "security-architecture.html",
    "revision": "43a385c5fc1b44b20a5f151278757a56"
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
    "revision": "2ac545ad5b77fd71d3aefaeefa62ad3e"
  }, {
    "url": "index.html",
    "revision": "2708dcc153a85b874e702198a7861c72"
  }, {
    "url": "image-annotation.html",
    "revision": "a4c1a431d6292f38a23d8caa47c8d3a6"
  }, {
    "url": "icon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "guide.html",
    "revision": "1286e9cd2cdbc41924c04c59a24a7145"
  }, {
    "url": "favicon.svg",
    "revision": "788afb0f782340c3c3474f3ae7141830"
  }, {
    "url": "contact.html",
    "revision": "2ed93cea113cb5f13a3a3deff175943a"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f2b5b280c8e91601653cbf5df738708d"
  }, {
    "url": "annotation.html",
    "revision": "cfded5344af52e51884729f2d58e1333"
  }, {
    "url": "about.html",
    "revision": "6862edd6e4c522883ffc085a27eddda7"
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
    "url": "assets/translation-nBg-jp7R.js",
    "revision": null
  }, {
    "url": "assets/input-DWxNcsBl.css",
    "revision": null
  }, {
    "url": "assets/imageAnnotation-DqJKv6hU.js",
    "revision": null
  }, {
    "url": "assets/favicon-B3Ar59hU.svg",
    "revision": null
  }, {
    "url": "assets/annotation-BmDpFEtu.js",
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
