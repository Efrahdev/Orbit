# Orbit Bookmarks 2.0

A framework-free bookmark manager prepared for GitHub Pages. No build tools or npm packages. Optional private sync across devices through your own Google Drive.

## Deploy
1. Extract this ZIP.
2. Upload index.html, contacts.html, orbit-dock.css, orbit-dock.js, sw.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png, noto-sans.woff2, library.json, .nojekyll and the apps-script folder to the root of your repository. Upload the files, not the ZIP itself.
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

## Orbit Contacts (contacts.html)
A phone-first contact list that lives next to your bookmarks. It is built for phones: on a desktop screen it shows a "use your phone" page (with a "Preview anyway" button).

**Switching between Bookmarks and Contacts**
- The bottom bar has four icon buttons: Bookmarks, +, Search and Contacts. The + adds a bookmark on Bookmarks and a new contact on Contacts. Search opens the search field at the top (Cancel closes it).
- Swipe sideways on the list to switch. Swipes that start at the very edge of the screen are left to your phone's Back gesture.
- To put Contacts on the left instead, open Contacts > Settings > Bottom bar.

**Using Contacts**
- Each contact is its own row card: a larger name, the number, Call, SMS and WhatsApp, plus small Edit and Copy icons. Tags show in the bar at the top, not in the rows. Tap the row to open the contact.
- Calls: on Android the call button opens Truecaller directly (no chooser). Switch to the phone app in Settings > Calls & numbers. If Truecaller is not installed, Android offers it in the Play Store.
- Search treats what you type as one exact phrase: "DB" finds only names, tags, numbers, emails or notes containing D and B together. Matches at the start of a name or word come first; any part of a number works ("40726").
- The A–Z button in the top corner shows the letter you are scrolling through; tap it for the letter grid. Starred contacts come first.
- Tags come from name prefixes automatically: a first word shared by several names ("BT …", "LX …", "South Point …", "Zinfi …") becomes a tag. Short codes need 3+ names, ordinary words 10+, so first names like "Sumit" do not. Delete a tag in Settings > Tags to hide it, or rename it. You can also add your own tags and apply them in bulk. Order in the bar: BT, E31, DB first; move any tag left or right with the arrows in Settings > Tags (synced to every phone).
- Bulk tagging: tap the select icon at the top (or hold a contact), pick people, then tap Tags. Tap a tag to add it to all of them, tap again to remove it. You can also create a new tag there and apply it straight away. The same bar can star or delete the selection.
- Numbers: every saved or imported number is stored as +country code and grouped, for example +91 98765 43210. Numbers without a + use the default country code in Settings. Settings > Data checks can format any older numbers in one tap.
- Duplicates: Settings > Data checks > Merge all merges every group that shares a number or email. The contact with the most detail wins and keeps the fullest name; every number, email and tag is kept and the other names go into the notes ("Also saved as …"). Contacts that only share a name are listed for review and never merged automatically. Importing a contact that is already saved merges it into the existing one.
- Settings > Recent changes is collapsed until you open it. Each entry shows +/− counts and expands into a git-style diff: green + lines for what was added, red − lines for what was removed.
- Delete asks for a second tap and offers Undo. Import from this phone (Android Chrome) and Import/Export .vcf are in Settings.

**Getting your existing contacts in (you never type into the Sheet)**
1. Open Contacts on the phone that has your contacts. Connect the Sheet first (see below), or do this step first and connect afterwards: either order works.
2. Tap the settings icon (top right) > **Import from this phone** (Android Chrome) and select everyone. Or use **Import .vcf**: on Android, Contacts app > Settings > Export to .vcf; on iPhone, use icloud.com > Contacts > select all > Export vCard.
3. The app saves them on the phone and, once connected, sends them to the Sheet within a second. Your other phones download them on their next sync.
4. Imports keep name, phone numbers, emails, notes and tags. Address, birthday and company are not kept.

**Sync across phones with your own Google Sheet**
1. Create a Google Sheet. Choose **Extensions > Apps Script**, delete the sample code and paste the whole of `apps-script/contacts-sync.gs`.
2. Change `SOS_PASSPHRASE` near the top to a secret phrase only you know. You never type it in everyday use; it is only for the emergency kill switch. Save.
3. **Deploy > New deployment > Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, then allow access when Google asks.
4. Copy the **Web app URL** (it ends in `/exec`).
5. On your phone, open Contacts > Sync & settings, paste the URL and tap Connect. No password needed.
6. For each extra phone, tap **Copy setup link for another phone**, send the link to yourself and open it on that phone. Or paste the same URL there.

How it works:
- Every phone keeps a full copy of your contacts in its own storage (IndexedDB), so search is instant and the app works offline.
- A phone syncs when the app opens, about a second after each change, when you come back to the app, and every 15 seconds while it is open. Changes made while offline are sent when the connection returns.
- If two phones change the same contact, the newer change wins. Deletes are kept as rows marked `Deleted = TRUE` so other phones learn about them.
- You can edit the Sheet by hand. Edited rows are stamped automatically and reach your phones on their next sync. New rows typed by hand get an ID by themselves. Rows deleted by hand disappear from phones at their next full resync (every 6 hours, or tap Full resync).
- Phones and emails are stored one per line, as `Label: value`. Tags are separated by commas.

**SOS kill switch (lost or stolen phone)**
- Each phone that joins gets its own device token. Joining needs only the URL.
- On any of your phones, open Sync & settings > SOS kill switch, type the SOS passphrase and hold the red button for 2 seconds.
- Sync locks at once and every phone's token is cancelled. Each phone, including the lost one, wipes its contacts the next time it is opened online and shows a lock screen. While locked, nobody can join, even with the URL.
- Your contacts are untouched in the Google Sheet. On a phone you trust, enter the SOS passphrase on the lock screen: sync unlocks and everything downloads again. Each other phone you still have unlocks the same way. The lost phone's old token stays cancelled.
- Limits: a phone that is never opened online again keeps its local copy until it is. If you think someone has the URL itself, make a new deployment in Apps Script (it gives a new URL) and connect your phones to that.

After updating `apps-script/contacts-sync.gs`, paste the new version into Apps Script and use **Deploy > Manage deployments > Edit > Version: New version > Deploy**. The URL stays the same.

Privacy: no contact data is ever stored in this repository or on GitHub Pages. It lives only in your Google Sheet and on your phones. After changing the script later, use **Deploy > Manage deployments > Edit > New version** so the same URL keeps working.

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
