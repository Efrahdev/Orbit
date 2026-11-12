# Orbit Bookmarks 2.0

A framework-free bookmark manager prepared for GitHub Pages. No build tools, npm packages, account or API key required.

## Deploy
1. Extract this ZIP.
2. Upload index.html, sw.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, library.json and .nojekyll to the root of your repository. Upload the files, not the ZIP itself.
3. In the repository, choose Settings > Pages > Build and deployment > Source > Deploy from a branch.
4. Select your main branch and /(root), then Save.
5. Open the HTTPS address shown by GitHub Pages after deployment.
6. On Android Chrome, use Install app when offered, or the browser's install menu. Availability is controlled by the browser. Offline use requires a successful initial online load.

The app uses relative paths, so it also supports a repository subdirectory URL. Keep all deployment files together.

## Save and organise
Quick capture accepts multiple HTTP/HTTPS links, including links embedded in copied text and bare domain names entered one per line. It normalises URLs, removes exact duplicates and derives editable titles from URL paths and domains, not fetched page metadata. URL query parameters are preserved, so tracking-parameter variants are distinct links.

Add with notes opens the detailed editor. Collections use paths such as Learning / Programming. Search includes titles, addresses, domains, collections, tags and notes. Recently opened records links opened through Orbit, not the browser's general history. Use checkboxes and Select visible for bulk move, JSON export and deletion.

Website icons are opt-in under Library. Orbit requests each destination's /favicon.ico directly; sites without that file fall back to a letter icon. HTTP icons may be blocked on HTTPS pages. No third-party icon service or analytics is used.

## Chrome import and export
Export bookmarks from desktop Chrome and choose Library > Import Chrome HTML. Nested folders become complete collection paths. Duplicate URLs are skipped. Non-HTTP/HTTPS bookmarks, including bookmarklets, are not imported.

Export to Chrome rebuilds nested folders as standard bookmark HTML. It does not carry Orbit notes, tags or favourites: use a full JSON backup for those. Empty Chrome folders are not retained because collections are derived from saved bookmarks. Folder names containing the literal separator ' / ' are interpreted as nested paths on HTML export.

## Backups and recovery
Full JSON backup includes bookmarks, favourites, notes, tags, dates, visit counts and theme/view/icon preferences. Restore validates the whole file before writing. Merge keeps existing local versions of duplicate URLs. Replace restores backup preferences, initiates a recovery download and also stores the previous library under recovery-before-replace in the same IndexedDB transaction. Check your Downloads folder: browsers may block downloads.

The database uses atomic writes. Errors do not intentionally overwrite existing saved state. Export backups regularly: browser data can still be cleared or evicted. Imports are limited to 30 MB and libraries to 50,000 bookmarks. Very large libraries render all matching cards and have not been performance-tested at that limit.

Orbit 1 localStorage data is migrated only when the new database has no saved library and the old data is accessible on the same origin. The old data is retained. A local file and a hosted site have different storage: export/import to move between them.

## Access from multiple devices: important
GitHub Pages hosts the application; it is NOT a private cloud database. IndexedDB belongs to the current browser and origin. There is no automatic two-way cloud sync, login or backend in this release.

For public, non-sensitive bookmarks:
1. Add or import your links.
2. Choose Library > Publish library snapshot.
3. Upload the downloaded library.json beside index.html in the repository, replacing the empty starter file.
4. Open the hosted site on another device. It automatically merges new published URLs on startup. Load published library can refresh manually.

This is an additive snapshot, not synchronisation: existing local versions win; remote edits and deletions do not replace local records; deleted local links may return if they remain in the published snapshot. To replace a device library exactly, restore a full backup in Replace mode instead.

Published snapshots include titles, URLs, collections, favourites, notes and tags. Opening history is reset in the published file. Anyone with access to the public site can read the snapshot. Do not upload private backups, confidential work links, tokens or secrets. A private repository does not necessarily make its Pages site private.

For private transfer, keep library.json empty and move a full backup between your devices yourself. True private automatic synchronisation remains a separate backend integration requiring a service choice, authentication and access rules. No credentials are embedded in these files.

## Offline and updates
The service worker caches the application shell, not destination websites or the published library. Previously saved bookmarks remain browsable offline; opening external destinations still needs connectivity. HTML navigation uses network-first with an offline fallback. Increase the cache version in sw.js when changing cached icons or manifest assets. Browser installation and service workers require HTTPS or localhost.

## Validation
Automated Chromium checks exercised bulk capture/deduplication, editing notes/tags, notes search, nested Chrome import, JSON backup download, merge restore, bulk move, persistence after reload and offline reload. Layout overflow checks passed at widths 320, 360, 412, 768, 1440 and 1920 CSS pixels. No page-level JavaScript errors were observed in those checks. This is not physical Android device certification or an exhaustive accessibility/security audit.

## References
- GitHub Pages deployment: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- PWA installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
