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
Orbit keeps every device in step through your own Google Drive. **No Google Cloud project, billing or API key is needed.** You deploy a small Google Apps Script on your own Google account. It saves the library as one file, `Orbit library (sync).json`, in your Drive, and Orbit talks to it. The script is guarded by a random secret key that Orbit puts in your copy. Merging happens inside Orbit. There is no third-party server.

### First device (best done on a computer, about 2 minutes)
1. Orbit → Library (☰) → Google Drive sync → **First device: set up** → **Copy script**.
2. Open https://script.google.com/home/projects/create, select all the sample code, and paste.
3. **Deploy → New deployment**, click the gear icon next to "Select type" and choose **Web app**. Set Execute as: **Me** and Who has access: **Anyone**, then click **Deploy**.
4. **Authorise access** and pick your account. Google shows "Google hasn't verified this app" because it is your own script: click **Advanced → Go to … (unsafe) → Allow**.
5. Copy the **Web app URL** (ending in `/exec`), paste it into Orbit and tap **Connect**. This device's bookmarks upload.

"Anyone" means anyone with the URL can reach the script, but it refuses every request without your secret key. The script runs as you, which is why Google asks for Drive access: it only ever touches its own file.

### Every other device
On the first device, tap **Copy code for another device** and send the code to yourself privately (for example, email to yourself). On the other device, paste it into the same box and tap **Connect**. That device's existing bookmarks merge in, and nothing is lost on either side. Anyone holding that code can read and change your bookmarks, so never post it publicly.

### Day to day
- Every change syncs about 1.5 seconds later. Orbit also syncs when you return to the tab, when the connection comes back, and every minute while open. You never need to sign in again.
- The cloud button in the top bar shows the state. Teal means synced, pulsing means syncing, an amber dot means changes are waiting (for example, offline), and a red dot means the last sync failed (tap it to retry and see why).
- Changes are always saved on the device first, so being offline loses nothing.
- If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

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

For private transfer, keep library.json empty and move a full backup between your devices yourself. For private automatic synchronisation, use Google Drive sync (above). No credentials are embedded in these files: your secret key lives only in your own script and in each connected browser.

## Search Builder
`search-query-builder.html` is a separate page on the same site (open `search-query-builder.html` next to `index.html`). It builds precise search links for YouTube, Amazon.in, Google and Google Shopping. Nothing you type is sent anywhere until you open a link.

- **YouTube:** the Type (including Shorts), Duration, Upload date, Prioritise and Features filters use the exact codes YouTube's own filter menu produced on 12 November 2026, and every one was checked against live results. YouTube removed sort by upload date, sort by rating and "Last hour" in January 2026, so those are gone. Precise date windows use the `before:` and `after:` operators instead, which were tested too. Combinations that make YouTube return an empty page (for example Shorts with a duration, or Live with 4K) are cleared automatically, with a note.
- **Words to avoid:** on YouTube, `-word` often adds the word instead of removing it (tested). So by default these words go to a strict Google Videos search limited to YouTube, which the result panel offers as its first "search plan" link.
- **Amazon.in:** 4★ & up, Prime, delivery by tomorrow, free delivery, discount tiers, stock and condition use refinement IDs taken from amazon.in's own pages. Price is sent in paise. For a strict brand filter, tick the brand on Amazon, copy the address and paste it into the Smart bar: the numeric brand ID is picked up. The Product inspector turns a product link into a clean link, critical and recent reviews, price history and YouTube reviews.
- **Smart bar:** type a plain sentence ("usb c cable review no shorts last 6 months 4k") or paste a YouTube, Amazon or Google search address, and it is read back into the form. If a site changes its codes, pasting a fresh address from that site keeps the builder working.
- History, saved searches and the theme are kept in this browser only. "Copy builder link" gives an address that reopens the page with every field filled in, so a finished search can be saved in Orbit.

## Offline and updates
The service worker caches the application shell (including the Search Builder page), not destination websites or the published library. Previously saved bookmarks remain browsable offline; opening external destinations still needs connectivity. HTML navigation uses network-first with an offline fallback, and each page is cached under its own address. Increase the cache version in sw.js when changing cached icons or manifest assets. Browser installation and service workers require HTTPS or localhost.

## Validation
Automated Chromium checks covered: the top-bar layout and the floating add button, saving localhost, LAN, file, mailto, javascript, chrome and plain-text entries, click behaviour for each (new tab, copy, and confirming a bookmarklet does not run), duplicate and same-address-different-name handling, select-all and individual selection, the right-hand Library panel, JSON backup and replace-restore round trip with unusual entries, persistence after reload, and no sideways overflow from 320 to 1280 CSS pixels with no page errors. This is not physical device certification or an exhaustive accessibility or security audit.

## References
- GitHub Pages deployment: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- PWA installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

## Font

Orbit uses Noto Sans (Latin subset, variable weight), bundled as `noto-sans.woff2` so nothing is fetched from outside. Characters outside that subset fall back to the system font. It is licensed under the SIL Open Font License; see `noto-sans-OFL.txt`.
