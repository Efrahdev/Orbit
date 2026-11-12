# Orbit Bookmarks 2.0

A framework-free bookmark manager prepared for GitHub Pages. No build tools or npm packages. Optional private sync across devices through your own Google Drive.

## Deploy
1. Extract this ZIP.
2. Upload index.html, sw.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, library.json and .nojekyll to the root of your repository. Upload the files, not the ZIP itself.
3. In the repository, choose Settings > Pages > Build and deployment > Source > Deploy from a branch.
4. Select your main branch and /(root), then Save.
5. Open the HTTPS address shown by GitHub Pages after deployment.
6. On Android Chrome, use Install app when offered, or the browser's install menu. Availability is controlled by the browser. Offline use requires a successful initial online load.

The app uses relative paths, so it also supports a repository subdirectory URL. Keep all deployment files together.

## Using Orbit
- **Top bar:** a tick button (top left) selects or deselects every visible bookmark; then the search box, a sort menu, and the three-bar menu (top right) that opens the Library panel from the right.
- **Add link:** the round + button floating at the bottom centre, within thumb reach. While rows are selected it is replaced by a bar with Move, Export, Delete and clear.
- **Rows:** one slim row per bookmark showing a serial number and the name you gave it. Tick boxes select; the icons on the right copy the link, pin it to the top, edit and delete. Pinned rows stay at the top and show small up and down arrows to put them in your own order. The Pinned filter shows only those. Clicking a row opens it.
- **Names:** editing requires a name. When you paste exactly one link you can name it straight away; otherwise the name defaults to the website domain and can be edited later.

## What you can save
Anything. Each non-empty line you paste is saved as typed, with no validation: web addresses, `localhost:3000` (saved as http), LAN addresses, `file:///` paths, `mailto:` and other app links, even plain text. Bare domains get https; bare `localhost`, IP addresses and host:port get http. Lines of ordinary text containing web links still have those links picked out. Query parameters are kept.

What happens on click depends on the browser, not Orbit:
- Web links and app links (`mailto:`, `tel:`, `whatsapp:` and similar) open normally. Web links open in a new tab of the browser you are using Orbit in; a web page cannot choose a different browser.
- `file:`, `chrome:`, `about:`, `data:` and plain text cannot be opened from a web page, so clicking copies the text to the clipboard.
- `javascript:` bookmarklets are saved but never run, because they would execute inside Orbit with access to your bookmarks. Clicking copies the text instead.
- `localhost` links only work on the device where that server is running.

The only thing skipped is an entry with exactly the same address and name as one already saved. The same address under a different name is allowed. Entries are limited to 100,000 characters. Search covers names, addresses, domains, collections, tags and notes.

## Chrome import and export
Export bookmarks from desktop Chrome and choose Library > Import Chrome HTML. Nested folders become complete collection paths. Duplicate URLs are skipped (an existing bookmark with the same address wins). Every bookmark with an address is imported, including bookmarklets (which are saved as copy-only text and never run).

Export to Chrome rebuilds nested folders as standard bookmark HTML. It does not carry Orbit notes, tags or pins: use a full JSON backup for those. Empty Chrome folders are not retained because collections are derived from saved bookmarks. Folder names containing the literal separator ' / ' are interpreted as nested paths on HTML export.

## Backups and recovery
Full JSON backup includes bookmarks, favourites, notes, tags, dates, visit counts and theme/view/icon preferences. Restore validates the whole file before writing. Merge keeps existing local versions of duplicate URLs. Replace restores backup preferences, initiates a recovery download and also stores the previous library under recovery-before-replace in the same IndexedDB transaction. Check your Downloads folder: browsers may block downloads.

The database uses atomic writes. Errors do not intentionally overwrite existing saved state. Export backups regularly: browser data can still be cleared or evicted. Imports are limited to 30 MB and libraries to 50,000 bookmarks. Very large libraries render all matching cards and have not been performance-tested at that limit.

Orbit 1 localStorage data is migrated only when the new database has no saved library and the old data is accessible on the same origin. The old data is retained. A local file and a hosted site have different storage: export/import to move between them.

## Google Drive sync (private, automatic)
Orbit can keep every device in step through your own Google Drive. The library is saved as one file in Drive's hidden **app data folder**, which only Orbit can see. It doesn't appear in your Drive file list, and Orbit can't see any of your other files (scope `drive.appdata`). There is still no Orbit server: the browser talks to Google directly.

### One-time setup (about 5 minutes)
Google needs to know which website is allowed to ask for Drive access, so you create a free "OAuth client ID" once:
1. Open https://console.cloud.google.com, sign in, and create a project (for example "Orbit").
2. **APIs & Services → Library**: search for **Google Drive API** and click **Enable**.
3. **Google Auth Platform** (formerly the OAuth consent screen): click **Get started**, enter the app name "Orbit" and your email, choose **External**, then finish.
4. **Audience → Test users**: add the Google account(s) you will sign in with. In Testing mode only these accounts can connect, which is right for personal use.
5. **Clients → Create client → Web application**. Under **Authorised JavaScript origins** add `https://efrahdev.github.io` (only the origin: no path, no trailing slash). Add `http://localhost:8000` too if you test locally. Redirect URIs are not needed. Click **Create** and copy the client ID (it ends in `.apps.googleusercontent.com`).
6. Either paste it into `GDRIVE_CLIENT_ID` in index.html (then every device has it automatically), or open Orbit → Library → Google Drive sync → **Setup** and save it there on each device.

### Using it
- On each device: Library → **Connect Google Drive** and sign in with the same Google account. Google will show an "unverified app" notice because the app is your own testing app: choose **Continue**.
- The first device uploads its library. Each later device merges its own bookmarks with the Drive copy, so nothing is lost on either side.
- After that, every change syncs about 1.5 seconds later. Orbit also syncs when you return to the tab, when the connection comes back, and every 2 minutes while open.
- The cloud button in the top bar shows the state. Teal means synced, pulsing means syncing, an amber dot means changes are waiting or sign-in has expired, and a red dot means the last sync failed. Tap it to sync now.
- **Sign-in renewal:** a browser-only app gets 1-hour Google access tokens and cannot renew them silently without a pop-up. When the amber dot shows after a long break, tap the cloud button. The pop-up closes by itself, and your waiting changes upload. Changes are always saved locally first, so nothing is lost while signed out.

### How conflicts are resolved
Each bookmark carries an edit timestamp. When two devices change the same bookmark, the newer edit wins. Deletions are remembered for 180 days, so a deleted link doesn't come back from another device (a device offline for longer than that may bring old deletions back). If two devices separately save the same name and address, they are merged into one. Pins, pin order, notes, tags and visit counts all sync. Theme/view preferences stay per device.

## Access from multiple devices without sync
GitHub Pages hosts the application; it is NOT a private cloud database. IndexedDB belongs to the current browser and origin. There is no automatic two-way cloud sync, login or backend in this release.

For public, non-sensitive bookmarks:
1. Add or import your links.
2. Choose Library > Publish library snapshot.
3. Upload the downloaded library.json beside index.html in the repository, replacing the empty starter file.
4. Open the hosted site on another device. It automatically merges new published URLs on startup. Load published library can refresh manually.

This is an additive snapshot, not synchronisation: existing local versions win; remote edits and deletions do not replace local records; deleted local links may return if they remain in the published snapshot. To replace a device library exactly, restore a full backup in Replace mode instead.

Published snapshots include titles, URLs, collections, pins, notes and tags. Opening history is reset in the published file. Anyone with access to the public site can read the snapshot. Do not upload private backups, confidential work links, tokens or secrets. A private repository does not necessarily make its Pages site private.

For private transfer, keep library.json empty and move a full backup between your devices yourself. For private automatic synchronisation, use Google Drive sync (above). No credentials are embedded in these files: a Google OAuth client ID is a public identifier, not a secret.

## Offline and updates
The service worker caches the application shell, not destination websites or the published library. Previously saved bookmarks remain browsable offline; opening external destinations still needs connectivity. HTML navigation uses network-first with an offline fallback. Increase the cache version in sw.js when changing cached icons or manifest assets. Browser installation and service workers require HTTPS or localhost.

## Validation
Automated Chromium checks covered: the top-bar layout and the floating add button, saving localhost, LAN, file, mailto, javascript, chrome and plain-text entries, click behaviour for each (new tab, copy, and confirming a bookmarklet does not run), duplicate and same-address-different-name handling, select-all and individual selection, the right-hand Library panel, JSON backup and replace-restore round trip with unusual entries, persistence after reload, and no sideways overflow from 320 to 1280 CSS pixels with no page errors. This is not physical device certification or an exhaustive accessibility or security audit.

## References
- GitHub Pages deployment: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- PWA installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

## Font

Orbit uses Noto Sans (Latin subset, variable weight), bundled as `noto-sans.woff2` so nothing is fetched from outside. Characters outside that subset fall back to the system font. It is licensed under the SIL Open Font License; see `noto-sans-OFL.txt`.
