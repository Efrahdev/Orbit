/**
 * Orbit Contacts: Google Sheet sync service.
 *
 * Setup (once):
 *  1. Create a Google Sheet. Choose Extensions > Apps Script.
 *  2. Replace the sample code with this whole file.
 *  3. Change SOS_PASSPHRASE below to a secret phrase only you know. It is NOT needed for everyday use:
 *     it is only for the emergency kill switch (lock every phone) and for unlocking afterwards.
 *  4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *  5. Copy the Web app URL (ends in /exec) into Orbit Contacts > Sync & settings and tap Connect.
 *
 * How access works: each phone joins with the URL and receives its own device token.
 * SOS: entering SOS_PASSPHRASE in any phone locks sync and cancels every token; each phone
 * wipes its local copy the next time it is opened online. Your data stays in this Sheet.
 * Unlock by entering SOS_PASSPHRASE on the lock screen of a trusted phone.
 *
 * After editing this code later, use Deploy > Manage deployments > Edit > Version: New version,
 * so the same URL keeps working.
 *
 * The sheet "Contacts" is the master copy. You may edit cells by hand: edits are stamped and
 * reach your phones on their next sync. To delete a row, set Deleted to TRUE (or delete it in the app);
 * rows removed by hand disappear from phones at their next full resync (every few hours).
 */
const SOS_PASSPHRASE = 'CHANGE-ME-to-a-secret-phrase';

const SHEET = 'Contacts';
const META = '_orbit_sync';
const DEVICES = '_orbit_devices';
const HEADERS = ['ID', 'Name', 'Phones', 'Emails', 'Tags', 'Notes', 'Favourite', 'Created', 'Updated', 'Deleted', 'Rev'];
const COL = {}; HEADERS.forEach((h, i) => COL[h] = i);

function doGet() {
  return json_({ ok: true, app: 'Orbit Contacts sync', message: 'Running. Connect from the Orbit Contacts app.' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Bad request.' }); }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: 'The sheet is busy. Will retry.' });
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ensureSheets_(ss);
    const meta = ss.getSheetByName(META);
    const action = String(body.action || 'sync');
    const locked = String(meta.getRange('B2').getValue()).toUpperCase() === 'TRUE';

    if (action === 'kill' || action === 'unlock') {
      if (!sosReady_()) return json_({ ok: false, error: 'Set SOS_PASSPHRASE in the Apps Script and deploy a new version to use the kill switch.' });
      if (!safeEqual_(String(body.passphrase || ''), SOS_PASSPHRASE)) { Utilities.sleep(1500); return json_({ ok: false, error: 'Wrong SOS passphrase.' }); }
      const dev = devices_(ss);
      if (action === 'kill') {
        if (dev.getLastRow() > 1) dev.deleteRows(2, dev.getLastRow() - 1);
        meta.getRange('B2').setValue('TRUE');
        meta.getRange('B3').setValue(new Date().toISOString());
        return json_({ ok: true, locked: true });
      }
      meta.getRange('B2').setValue('FALSE');
      return json_({ ok: true, token: register_(ss, body.device) });
    }
    if (locked) return json_({ ok: false, code: 'locked', error: 'Sync is locked by the SOS kill switch.' });
    if (action === 'register') return json_({ ok: true, token: register_(ss, body.device) });
    if (!checkToken_(ss, String(body.token || ''))) return json_({ ok: false, code: 'revoked', error: 'This phone is no longer allowed to sync.' });
    const cursor = Number(body.cursor) || 0;
    const changes = Array.isArray(body.changes) ? body.changes : [];
    let rev = Number(meta.getRange('B1').getValue()) || 0;

    // Fast path: nothing to push and nothing new since this phone's cursor.
    if (!changes.length && cursor > 0 && cursor >= rev) {
      return json_({ ok: true, cursor: rev, changes: [] });
    }

    const last = sh.getLastRow();
    const width = HEADERS.length;
    const values = last > 1 ? sh.getRange(2, 1, last - 1, width).getValues() : [];
    const byId = {};
    values.forEach((row, i) => { if (row[COL.ID]) byId[String(row[COL.ID])] = i; });

    const rejected = [];
    const appended = [];
    const touched = {};
    changes.forEach(c => {
      if (!c || !c.id) return;
      const id = String(c.id).slice(0, 80);
      const at = byId[id];
      if (at !== undefined) {
        const cur = values[at];
        if (stamp_(cur[COL.Updated]) > (Number(c.updatedAt) || 0)) { rejected.push(at); return; }
        rev++;
        values[at] = toRow_(c, rev);
        touched[at] = true;
      } else {
        rev++;
        const row = toRow_(c, rev);
        values.push(row);
        byId[id] = values.length - 1;
        appended.push(row);
      }
    });

    // Write changed rows back (only the rows that changed).
    Object.keys(touched).forEach(k => {
      const i = Number(k);
      sh.getRange(i + 2, 1, 1, width).setValues([values[i]]);
    });
    if (appended.length) {
      sh.getRange(last + 1 > 1 ? last + 1 : 2, 1, appended.length, width).setValues(appended);
    }
    meta.getRange('B1').setValue(rev);

    const out = [];
    const seen = {};
    values.forEach((row, i) => {
      if (!row[COL.ID]) return;
      if ((Number(row[COL.Rev]) || 0) > cursor || rejected.indexOf(i) >= 0) {
        if (!seen[row[COL.ID]]) { out.push(fromRow_(row)); seen[row[COL.ID]] = true; }
      }
    });
    return json_({ ok: true, cursor: rev, changes: out });
  } catch (err) {
    return json_({ ok: false, error: 'Script error: ' + (err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

/** Stamp rows that are edited by hand in the sheet so phones pick up the change. */
function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== SHEET) return;
    const r0 = Math.max(2, e.range.getRow());
    const r1 = e.range.getLastRow();
    if (r1 < 2) return;
    const ss = sh.getParent();
    const meta = ss.getSheetByName(META);
    if (!meta) return;
    let lock = null;
    try { lock = LockService.getScriptLock(); lock.waitLock(10000); } catch (err) { lock = null; }
    try {
      let rev = Number(meta.getRange('B1').getValue()) || 0;
      const n = r1 - r0 + 1;
      const rng = sh.getRange(r0, 1, n, HEADERS.length);
      const vals = rng.getValues();
      const now = new Date().toISOString();
      let changed = false;
      vals.forEach(row => {
        const hasContent = row.slice(1, COL.Notes + 1).some(v => String(v).trim() !== '');
        if (!hasContent && !row[COL.ID]) return;
        if (!row[COL.ID]) row[COL.ID] = Utilities.getUuid();
        if (!row[COL.Created]) row[COL.Created] = now;
        row[COL.Updated] = now;
        rev++;
        row[COL.Rev] = rev;
        changed = true;
      });
      if (changed) {
        rng.setValues(vals.map(row => row.map(safe_)));
        meta.getRange('B1').setValue(rev);
      }
    } finally {
      if (lock) lock.releaseLock();
    }
  } catch (err) { /* never block the user's edit */ }
}

/* ---------- helpers ---------- */
function sosReady_() { return SOS_PASSPHRASE !== 'CHANGE-ME-to-a-secret-phrase' && SOS_PASSPHRASE.length >= 6; }

function devices_(ss) {
  let d = ss.getSheetByName(DEVICES);
  if (!d) {
    d = ss.insertSheet(DEVICES);
    d.getRange(1, 1, 1, 4).setValues([['Token', 'Device', 'Joined', 'Last seen']]);
    d.hideSheet();
  }
  return d;
}

function register_(ss, name) {
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const now = new Date().toISOString();
  devices_(ss).appendRow([token, str_(name, 80) || 'Phone', now, now]);
  return token;
}

function checkToken_(ss, token) {
  if (token.length < 30) return false;
  const d = devices_(ss);
  const n = d.getLastRow() - 1;
  if (n < 1) return false;
  const vals = d.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < n; i++) {
    if (safeEqual_(String(vals[i][0]), token)) { d.getRange(i + 2, 4).setValue(new Date().toISOString()); return true; }
  }
  return false;
}

function ensureSheets_(ss) {
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0].setName(SHEET) : ss.insertSheet(SHEET);
  }
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== 'ID') {
    if (sh.getLastRow() > 0) sh.insertRowBefore(1);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#1e1b4b').setFontColor('#ede9fe');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@').setVerticalAlignment('top');
    sh.getRange(2, COL.Phones + 1, sh.getMaxRows() - 1, 2).setWrap(true);
    const widths = [90, 180, 220, 220, 140, 260, 80, 170, 170, 70, 60];
    widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.hideColumns(COL.ID + 1);
    sh.hideColumns(COL.Rev + 1);
  }
  let meta = ss.getSheetByName(META);
  if (!meta) {
    meta = ss.insertSheet(META);
    meta.getRange('A1:B3').setValues([['lastRev', 0], ['locked', 'FALSE'], ['lockedAt', '']]);
    meta.hideSheet();
  }
  return sh;
}

function toRow_(c, rev) {
  const lines = (list, def) => (Array.isArray(list) ? list : [])
    .filter(x => x && String(x.value || '').trim())
    .map(x => (String(x.label || def).trim() || def) + ': ' + String(x.value).trim()).join('\n');
  const row = [
    String(c.id).slice(0, 80),
    str_(c.name, 200),
    lines(c.phones, 'Mobile'),
    lines(c.emails, 'Personal'),
    (Array.isArray(c.tags) ? c.tags : []).map(t => str_(t, 40)).filter(String).join(', '),
    str_(c.notes, 5000),
    c.fav ? 'TRUE' : 'FALSE',
    new Date(Number(c.createdAt) || Date.now()).toISOString(),
    new Date(Number(c.updatedAt) || Date.now()).toISOString(),
    c.deleted ? 'TRUE' : 'FALSE',
    rev
  ];
  return row.map(safe_);
}

function fromRow_(row) {
  const parse = (text, def) => String(text || '').split(/\n|\s\|\s/).map(s => s.trim()).filter(String).map(s => {
    const m = s.match(/^([^:]{1,40}):\s*(.+)$/);
    return m && !/^(https?|mailto|tel)$/i.test(m[1]) ? { label: m[1].trim(), value: m[2].trim() } : { label: def, value: s };
  });
  const bool = v => v === true || String(v).toUpperCase() === 'TRUE' || v === 1 || String(v).toLowerCase() === 'yes';
  return {
    id: String(row[COL.ID]),
    name: String(row[COL.Name] || ''),
    phones: parse(row[COL.Phones], 'Mobile'),
    emails: parse(row[COL.Emails], 'Personal'),
    tags: String(row[COL.Tags] || '').split(',').map(s => s.trim()).filter(String),
    notes: String(row[COL.Notes] || ''),
    fav: bool(row[COL.Favourite]),
    createdAt: stamp_(row[COL.Created]) || 0,
    updatedAt: stamp_(row[COL.Updated]) || 0,
    deleted: bool(row[COL.Deleted])
  };
}

function stamp_(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  const t = Date.parse(String(v || ''));
  return isNaN(t) ? 0 : t;
}
function str_(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }
/** Stop text that starts with = + - @ from being read as a formula. */
function safe_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
