# PWA Template

A minimal Progressive Web App with no build step and no dependencies. The page is a test card: it shows on a real device what each part does.

**Demo**: [aronsommer.github.io/pwa-template](https://aronsommer.github.io/pwa-template/)

## What it shows

- **Install**: the Install button in Chrome on Android and desktop. On iPhone: Share, then Add to Home Screen.
- **Offline**: the service worker precaches the files the page needs, so the app starts with no network.
- **Updates**: every deploy is a new version, shown in the footer.
- **Edge to edge**: the page fills the viewport and keeps its content inside the safe area, which the two blue bars mark.
- **Fullscreen**: the button also hides the status bar. Not on iPhone.
- **Notifications**: the button shows a notification through the service worker, with no server.

The page also prints what the device reports: display mode, safe area, viewport heights, notification permission and whether the font loaded. A button the device cannot use is disabled.

## Use it

1. Copy the files into a new repository.
2. In the repository settings, under Pages, set the source to **GitHub Actions**.
3. Push to `main`.

All URLs are relative, so it works at `user.github.io/repo/` and on a custom domain.

**Rebrand**: the name in `index.html`, `app.js`, `manifest.json` (`name`, and `short_name` for the label under the home screen icon) and `sw.js` (`PREFIX`), the colors in `style.css` and `manifest.json`, the [icons](#icons), the font in `fonts/`.

**Add a file**: list it in `SHELL` in `sw.js`. A script or stylesheet is also requested with `?v=__BUILD_TIMESTAMP__`, and listed in `SHELL` with the same `?v=`. If the request is not in `index.html`, add that file to the `sed` line in `.github/workflows/deploy.yml`.

## Offline and updates

- Each deploy writes its time into `index.html` and `sw.js` as the version. The changed `sw.js` makes the browser install the new service worker, which precaches the new files and deletes the old cache.
- The page comes from the network when there is one, otherwise from the cache. All other files come from the cache; `style.css` and `app.js` are requested with `?v=` and the version, so a page never gets another version's copy.
- Only files from the app's own origin are cached, so the font is a file in the repository.

To see an update: push a commit, wait for the deploy, load the page again. The version in the footer changes.

On a local server nothing replaces the placeholder, so the service worker keeps serving the cached `style.css` and `app.js`. In Chrome DevTools, tick Application > Service workers > Bypass for network.

## What each platform does

The installed app, checked on iOS 27.0 and on stable Chrome for Android in October 2026.

|                   | iPhone                                                                    | Android                                                  |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| Status bar        | The page does not show behind it; it takes the background color of `html` | The page does not show behind it; it takes `theme_color` |
| Fullscreen button | Disabled; iPhone has no Fullscreen API                                    | Hides the status bar; the page reaches the cutout        |
| Notifications     | Only in the installed app, iOS 16.4+                                      | Yes, also in a browser tab                               |

### Android: the coming fix

Chrome is working on drawing an installed app with `viewport-fit=cover` behind the system bars and the camera cutout ([issue 407420295](https://issues.chromium.org/issues/407420295)). It works in Chrome Canary with the flag "Web App Short Edges Cutout Mode" set to "Enabled (Standalone also enabled)", and the template needs no change for it.

Until then, `display: fullscreen` in the manifest leaves a black bar over the cutout ([issue 527962020](https://issues.chromium.org/issues/527962020), [demo](https://github.com/aronsommer/chromium-pwa-cutout-bug)); only the Fullscreen button reaches it.

## Colors

The colors are not meant to look good. Each one stands for one thing, so you can see on the device where it ends up.

- **Red**: the background of `html` in `style.css`.
- **Stripes**: the background of `body` in `style.css`.
- **Yellow**: the part of `body` outside the safe area.
- **Cyan**: `theme_color` in `manifest.json`. In desktop Chrome it is the title bar of the installed app.
- **Green**: `background_color` in `manifest.json`. On Android it is the screen that shows for a moment, with the icon, while the installed app starts.
- **Blue**: the two bars at the edges of the safe area, and the buttons.

## Icons

`make-icons.sh` generates the icons in `img/` from one design, the transparent `icon-1024x1024.png`. It needs ImageMagick.

- **`pwa-icon-512x512.png`**: the notification, and systems that do not take the maskable icon. Square, edge to edge.
- **`pwa-icon-512x512-maskable.png`**: the installed app on Android and, from Chrome, on macOS, which cut it to their own shape. Only the center circle, 80% as wide as the icon, is safe, so the design is smaller.
- **`apple-touch-icon.png`**: the iPhone's home screen, and Google's search results can use it. Square, edge to edge; iOS rounds it.
- **`favicon.ico`**: the browser tab. Rounded corners.

## Font

[Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (OFL). The file holds Latin characters only; other scripts fall back to the system font.

## Real push

The button shows a local notification. A push that arrives while the app is closed needs a server: it signs each message with a private key, which cannot be kept in a web page.

## License

[MIT](LICENSE)
