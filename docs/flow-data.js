/* FMSC prototype data: packing sites, sign-up answer formatting and saved reservations (window.FMSCData).
   No side effects on load: it injects no CSS and never clears storage; it only reads and writes when a page calls it.
   Used by signup-shell.js (the sign-up flow), event-upcoming.html and the account pages (dashboard, volunteering, people).
   Contract: build/DYNAMIC_NOTES.md (Oct. 22, 2026).

   - sites: the catalog, keyed by slug (signup-1.html?path=a&site=<slug>). Permanent-site addresses and phones are from
     fmsc.org/locations/<city-st> (checked Oct. 22, 2026), AP style like the Coon Rapids frame. MobilePack events are the
     prototype's sample events (Volunteer and Host a MobilePack cards, homepage module): city line from the card,
     FMSC's main number (fmsc.org/about-us/contact-us), no street address.
   - resolve(flow, path): stored sign-up answers with the Figma samples filled in, plus every formatted string the
     sign-up pages show.
   - reservations: what step 4 of the flow saved, in sessionStorage 'fmsc-reservations' (array, newest last).
   - TODAY: the prototype's "today", Sept. 1, 2026 (upcoming vs past, "N days away").
   - profile: the signed-in person's details from Profile and settings, in sessionStorage 'fmsc-profile' (nav, dashboard,
     People, event rosters, hours record, giving statement and sign-up confirmations read it). */
(function () {
  var MONTHS_AP = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var TODAY = { year: 2026, month: 8, day: 1 };

  /* ---- packing sites and events ----
     Permanent sites open every October 2026 day the Figma calendar shows a dot; events open only on their dates, and the
     calendar opens on that month. street / cityLine are the "Getting there" lines; city is the account pages' place line. */
  var PERMANENT_CLOSED = [4, 10, 11, 18, 24, 25];
  var MAIN_PHONE = '763-504-2919';
  function permanent(name, address, phone, street, city, cityLine) {
    return { kind: 'permanent', tag: 'Permanent site', name: name, where: 'FMSC ' + name, title: 'Pack meals at FMSC ' + name,
      at: 'FMSC ' + name, address: address, directions: true, phone: phone, year: 2026, month: 9, closed: PERMANENT_CLOSED, defaultDay: 3,
      street: street, city: city, cityLine: cityLine || city };
  }
  function mobilepack(name, title, where, cityText, month, open) {
    return { kind: 'mobilepack', tag: 'MobilePack event', name: name, where: where, title: title, address: cityText, directions: false,
      at: 'the ' + where, phone: MAIN_PHONE, year: 2026, month: month, open: open, defaultDay: open[0],
      street: null, city: cityText, cityLine: cityText };
  }
  var SITES = {
    'coon-rapids': permanent('Coon Rapids', '401 93rd Ave. NW, Coon Rapids', '763-951-7308', '401 93rd Ave. NW', 'Coon Rapids, MN', 'Coon Rapids, MN 55433'),
    'eagan': permanent('Eagan', '990 Lone Oak Road, Suite 136, Eagan', '763-746-2952', '990 Lone Oak Road, Suite 136', 'Eagan, MN'),
    'chanhassen': permanent('Chanhassen', '18732 Lake Drive East, Chanhassen', '952-937-2329', '18732 Lake Drive East', 'Chanhassen, MN'),
    'aurora': permanent('Aurora', '555 Exchange Court, Aurora, Illinois', '630-851-0404', '555 Exchange Court', 'Aurora, IL'),
    'libertyville': permanent('Libertyville', '742 E. Park Ave., Libertyville, Illinois', '847-984-3846', '742 E. Park Ave.', 'Libertyville, IL'),
    'schaumburg': permanent('Schaumburg', '740 Wiley Farm Court, Schaumburg, Illinois', '847-519-9614', '740 Wiley Farm Court', 'Schaumburg, IL'),
    'richardson': permanent('Richardson', '1680 N. Glenville Drive, Suite 300, Richardson, Texas', '214-453-5480', '1680 N. Glenville Drive, Suite 300', 'Richardson, TX'),
    'tempe': permanent('Tempe', '1100 W. Grove Parkway, Suite 101, Tempe, Arizona', '480-626-1970', '1100 W. Grove Parkway, Suite 101', 'Tempe, AZ'),
    'rochester-mobilepack': mobilepack('Rochester', 'Pack meals at the Rochester MobilePack™ event', 'Rochester MobilePack™ event', 'Rochester, MN', 9, [3, 4, 5]),
    'jordan-mobilepack': mobilepack('Jordan', 'Pack meals at Jordan Community FMSC MobilePack', 'Jordan Community FMSC MobilePack', 'Jordan, MN', 8, [4]),
    'st-croix-valley-packs-hope': mobilepack('St. Croix Valley', 'Pack meals at St. Croix Valley Packs Hope', 'St. Croix Valley Packs Hope', 'St. Croix Valley', 8, [6]),
    /* Host a MobilePack "Upcoming events near you" cards: Lakeview High School (Hudson, WI · Nov. 7–8 · registration
       opens Oct. 10) and St. Mark's Lutheran Church (St. Cloud, MN · Oct. 17–18). */
    'lakeview-mobilepack': mobilepack('Hudson', 'Pack meals at the Lakeview High School MobilePack™ event', 'Lakeview High School MobilePack™ event', 'Hudson, WI', 10, [7, 8]),
    'st-marks-mobilepack': mobilepack('St. Cloud', 'Pack meals at the St. Mark’s Lutheran Church MobilePack™ event', 'St. Mark’s Lutheran Church MobilePack™ event', 'St. Cloud, MN', 9, [17, 18])
  };
  var DEFAULT_SITE = 'coon-rapids';
  function siteSlug(slug) { return slug && Object.prototype.hasOwnProperty.call(SITES, slug) ? slug : null; }
  /* site(slug): the catalog entry with its slug (Coon Rapids for an unknown slug). */
  function site(slug) { var s = siteSlug(slug) || DEFAULT_SITE; return Object.assign({ slug: s }, SITES[s]); }
  function isOpen(st, day) {
    var n = new Date(st.year, st.month + 1, 0).getDate();
    if (!(day >= 1 && day <= n)) return false;
    return st.open ? st.open.indexOf(day) >= 0 : st.closed.indexOf(day) < 0;
  }

  /* ---- formatting ---- */
  function spotsText(n) { return n + (n === 1 ? ' spot' : ' spots'); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  /* "9–11 a.m." → arrive 15 minutes before the start: "8:45 a.m." */
  function arriveTime(time) {
    var m = /^(\d{1,2})(?::(\d{2}))?/.exec(time || ''); if (!m) return '8:45 a.m.';
    var pm = ((time.match(/[ap]\.m\./) || ['a.m.'])[0]) === 'p.m.';
    var t = ((+m[1]) % 12 + (pm ? 12 : 0)) * 60 + (+(m[2] || 0)) - 15;
    var H = Math.floor(t / 60), M = t % 60;
    return (H % 12 || 12) + (M ? ':' + pad2(M) : '') + ' ' + (H >= 12 ? 'p.m.' : 'a.m.');
  }
  /* "9–11 a.m." → "9 a.m."; "11:30 a.m.–1:30 p.m." → "11:30 a.m."; "4:30–6:30 p.m." → "4:30 p.m." */
  function startTime(time) {
    var parts = String(time || '9–11 a.m.').split('–'), first = parts[0].trim();
    if (/[ap]\.m\./.test(first)) return first;
    return first + ' ' + ((String(time).match(/[ap]\.m\./) || ['a.m.'])[0]);
  }
  /* Date strings for a year/month(0–11)/day. */
  function dateParts(year, month, day) {
    var d = new Date(year, month, day), mon = MONTHS_AP[month];
    return { dateShort: mon + ' ' + day, dateLabel: WEEKDAYS[d.getDay()] + ', ' + mon + ' ' + day, dateLong: mon + ' ' + day + ', ' + year,
      month: mon.replace('.', ''), dayNum: String(day), iso: year + '-' + pad2(month + 1) + '-' + pad2(day) };
  }
  /* Whole days from the prototype's today (Sept. 1, 2026) to the date; negative = past. */
  function daysFromToday(year, month, day) {
    return Math.round((Date.UTC(year, month, day) - Date.UTC(TODAY.year, TODAY.month, TODAY.day)) / 864e5);
  }
  function daysAwayText(n) { return n === 0 ? 'Today' : n === 1 ? '1 day away' : n + ' days away'; }

  var BLANK_GROUP = 'Your group';
  /* Figma sample answers per path (used when nothing is stored, e.g. a page opened directly). */
  var SAMPLES = {
    a: { spots: 1 },
    b: { group: 'Grace Church Youth Group', spots: 12, slug: 'grace-4821', code: 'GRACE' },
    c: { group: 'Whitfield Household', spots: 4, type: 'Family', num: '3306' },
    d: { group: 'Faith Lutheran Confirmation Class', spots: 15, type: 'Church: Youth Over 12', num: '2187' }
  };
  var PATHS = ['a', 'b', 'c', 'd'];

  /* resolve(flow, path): flow-store answers with the Figma samples filled in, plus every formatted string the pages show.
     Flow keys: site · day · time · spotsLeft · who · groupName · groupType · under18 · spots · packing · done2 · waiver. */
  function resolve(f, path) {
    f = f || {};
    var p = PATHS.indexOf(path) >= 0 ? path : 'a', s = SAMPLES[p], st = site(f.site);
    var YEAR = st.year, MONTH = st.month;
    var day = isOpen(st, f.day) ? f.day : st.defaultDay;
    var time = typeof f.time === 'string' && f.time ? f.time : '9–11 a.m.';
    var dp = dateParts(YEAR, MONTH, day), mon = MONTHS_AP[MONTH];
    var spots = p === 'a' ? 1 : (f.spots >= 1 ? Math.round(f.spots) : s.spots);
    var packing = f.packing === 'no' ? 'no' : 'yes';
    var groupName = typeof f.groupName === 'string' ? f.groupName : '';
    var group = p === 'b' ? s.group : p === 'a' ? null
      : (typeof f.groupName !== 'string' ? s.group : (groupName.trim() || BLANK_GROUP));
    var groupType = p === 'c' ? 'Family' : p === 'd' ? (f.groupType && f.groupType !== 'Family' ? f.groupType : s.type) : null;
    /* Invite link and join code follow the group name and date ("whitfield-3306/oct-3", "WHITFIELD-1003"). */
    var word = group && group !== BLANK_GROUP ? (group.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    var slug = p === 'b' ? s.slug : (word || 'group') + '-' + (s.num || '0000');
    var mmdd = pad2(MONTH + 1) + pad2(day);
    return {
      path: p, year: YEAR, monthIndex: MONTH, day: day, time: time, spotsLeft: f.spotsLeft || '18 spots left',
      dateLabel: dp.dateLabel, dateShort: dp.dateShort, month: dp.month, dayNum: dp.dayNum,
      when: dp.dateLabel + ' · ' + time, shortSummary: dp.dateShort + ' · ' + time + ' · ' + st.name, site: st, where: st.where, arrive: arriveTime(time),
      who: p === 'a' ? 'me' : 'group', group: group, groupName: groupName, groupType: groupType,
      under18: f.under18 === 'No' ? 'No' : 'Yes', spots: spots, spotsText: spotsText(spots), packing: packing,
      claimedBase: p === 'a' ? 1 : (packing === 'yes' ? 1 : 0), waiver: !!f.waiver, done2: !!f.done2,
      answer2: p === 'a' ? 'Just me · 1 spot' : group + ' · ' + spotsText(spots),
      linkUrl: 'fmsc.org/join/' + slug + '/' + mon.replace('.', '').toLowerCase() + '-' + day,
      code: (p === 'b' ? s.code : (word ? word.toUpperCase() : 'GROUP')) + '-' + mmdd
    };
  }
  /* Invite link note for the confirmation pages, by open spots left. */
  function linkNote(r, open) {
    if (open > 1) return 'Anyone with this link joins ' + r.group + ' and takes one of the ' + open + ' open spots on ' + r.dateShort + '.';
    if (open === 1) return 'Anyone with this link joins ' + r.group + ' and takes the last open spot on ' + r.dateShort + '.';
    return (r.spots === 1 ? 'Your 1 spot is claimed.' : 'All ' + r.spots + ' spots are claimed.') + ' Add spots from your reservation to invite more people.';
  }

  /* ---- saved reservations (sessionStorage 'fmsc-reservations', newest last; memory fallback when storage is blocked) ----
     Record: { id, path, site (slug), year, month (0–11), day, date (ISO), time, arrive, group (null for path a),
       groupType, under18, packing, spots, claimed, added: [names], linkUrl, code, savedAt } */
  var RES_KEY = 'fmsc-reservations';
  var memRes = null;
  function list() {
    try { var a = JSON.parse(sessionStorage.getItem(RES_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (r) { return r && r.id; }) : []; }
    catch (e) { return (memRes || []).slice(); }
  }
  function writeAll(arr) {
    memRes = arr.slice();
    try { sessionStorage.setItem(RES_KEY, JSON.stringify(arr)); } catch (e) { /* storage blocked: memory only */ }
  }
  function get(id) { if (!id) return null; var a = list(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function latest() { var a = list(); return a.length ? a[a.length - 1] : null; }
  /* save(rec): upsert by id; the saved record moves to the end (newest last). Returns the stored record. */
  function save(rec) {
    var a = list().filter(function (r) { return r.id !== rec.id; });
    var prev = get(rec.id) || {};
    var next = Object.assign({}, prev, rec, { savedAt: Date.now() });
    a.push(next); writeAll(a);
    return next;
  }
  function update(id, patch) { var r = get(id); return r ? save(Object.assign({}, r, patch, { id: id })) : null; }
  function newId() { return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  /* Strings for a saved reservation (also used for the Figma sample below). */
  function describe(r) {
    var st = site(r.site), dp = dateParts(r.year, r.month, r.day), days = daysFromToday(r.year, r.month, r.day);
    return Object.assign({ site: st, days: days, upcoming: days >= 0, daysAway: daysAwayText(days), start: startTime(r.time),
      arrive: r.arrive || arriveTime(r.time), spotsText: spotsText(r.spots) }, dp);
  }
  /* Flow-store answers that reopen a reservation in the sign-up flow (signup-1.html?…&resume=<id>). */
  function toFlow(r) {
    var f = { site: r.site, day: r.day, time: r.time, resId: r.id, done2: true, waiver: true, packing: r.packing || 'yes', added: (r.added || []).slice() };
    if (r.path !== 'a') f.spots = r.spots;
    if (r.path === 'c' || r.path === 'd') { f.groupName = r.group || ''; f.under18 = r.under18 || 'Yes'; }
    if (r.path === 'd') f.groupType = r.groupType;
    f.who = r.path === 'a' ? 'me' : 'group';
    return f;
  }
  function sortByDate(arr) { return arr.slice().sort(function (x, y) { return (x.date < y.date ? -1 : x.date > y.date ? 1 : 0); }); }
  /* The Figma sample shift (Saturday, Oct. 3, FMSC Coon Rapids, Grace Church Youth Group, 8 of 12 claimed). */
  var SAMPLE_RESERVATION = { id: 'sample', path: 'b', site: 'coon-rapids', year: 2026, month: 9, day: 3, date: '2026-10-03', time: '9–11 a.m.', arrive: '8:45 a.m.',
    group: 'Grace Church Youth Group', spots: 12, claimed: 8, added: [], linkUrl: 'fmsc.org/join/grace-4821/oct-3', code: 'GRACE-1003', sample: true };

  /* People the confirmation pages let you add (same names and descriptions as signup-b4 and signup-c4/d4), for the event
     page's "Who's coming" and invite list. grace: Grace Church Youth Group (9 people, first 8 listed); account: the
     people on Sarah's account (paths c and d). */
  var PEOPLE = {
    grace: [
      { name: 'Sarah Whitfield', desc: 'Admin · you', you: true }, { name: 'Dana Reyes', desc: 'Admin' }, { name: 'Tom Whitfield', desc: 'Member' },
      { name: 'Ben Ortiz', desc: 'Member' }, { name: 'Jake Sorensen', desc: 'Member' }, { name: 'Priya Nair', desc: 'Member' },
      { name: 'Carol Whitfield', desc: 'Guest · no FMSC account' }, { name: 'Maya Whitfield', desc: 'Under 18 · your child', minor: true }
    ],
    graceCount: 9,
    account: [
      { name: 'Sarah Whitfield', desc: 'You', you: true }, { name: 'Maya Whitfield', desc: 'Your child · 14', minor: true },
      { name: 'Lily Whitfield', desc: 'Your child · 9', minor: true }, { name: 'Carol Whitfield', desc: 'No FMSC account' }
    ]
  };

  /* ---- the signed-in person's profile (sessionStorage 'fmsc-profile'; memory fallback when storage is blocked) ----
     Defaults are the Figma persona on Profile and settings (Sarah Whitfield). Sample data across the prototype keeps the
     name 'Sarah Whitfield' as the signed-in person's key (rosters, saved reservations' added names); pages show it with
     display(name), so a renamed profile carries through without touching stored records.
     Saved: { firstName, lastName, birthdate, phone, phoneType, street, city, state, zip, mailing, emails: [{ addr, meta, primary }] } */
  var PROFILE_KEY = 'fmsc-profile', PERSONA = 'Sarah Whitfield', PROFILE_EVENT = 'fmsc-profile';
  var PROFILE_DEFAULTS = {
    firstName: 'Sarah', lastName: 'Whitfield', birthdate: '04/12/1981', phone: '763-555-0148', phoneType: 'Mobile',
    street: '1420 Oak Ridge Dr.', city: 'Coon Rapids', state: 'Minnesota', zip: '55433', mailing: '',
    emails: [
      { addr: 'sarah.whitfield@gmail.com', meta: 'Sign-in and receipts', primary: true },
      { addr: 's.whitfield@gracechurch.org', meta: '3 gifts, 2 shifts came in under this' },
      { addr: 'sarahw1981@yahoo.com', meta: '1 gift came in under this' }
    ]
  };
  var memProfile = null;
  function cloneProfile(p) { return JSON.parse(JSON.stringify(p)); }
  function profileGet() {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { saved = memProfile; }
    var p = cloneProfile(PROFILE_DEFAULTS);
    if (saved && typeof saved === 'object') {
      Object.keys(PROFILE_DEFAULTS).forEach(function (k) {
        if (k === 'emails') { if (Array.isArray(saved.emails) && saved.emails.some(function (e) { return e && e.addr; })) p.emails = saved.emails.filter(function (e) { return e && e.addr; }); }
        else if (typeof saved[k] === 'string') p[k] = saved[k];
      });
    }
    /* Exactly one primary address: the flagged one, else the first. */
    var pi = -1; p.emails.forEach(function (e, i) { if (e.primary && pi < 0) pi = i; });
    p.emails = p.emails.map(function (e, i) { return Object.assign({}, e, { primary: i === (pi < 0 ? 0 : pi) }); });
    return p;
  }
  /* save(patch): merges into the stored profile, then tells the page (the nav listens) with a 'fmsc-profile' event. */
  function profileSave(patch) {
    var next = Object.assign(profileGet(), patch || {});
    memProfile = cloneProfile(next);
    try { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch (e) { /* storage blocked: memory only */ }
    try { window.dispatchEvent(new CustomEvent(PROFILE_EVENT)); } catch (e) { /* old browsers: pages pick it up on load */ }
    return profileGet();
  }
  function firstName(p) { p = p || profileGet(); return p.firstName.trim() || PROFILE_DEFAULTS.firstName; }
  function lastName(p) { p = p || profileGet(); return p.lastName.trim(); }
  function fullName(p) { p = p || profileGet(); return (firstName(p) + ' ' + lastName(p)).trim(); }
  /* "SW"; one name gives one letter. */
  function initials(p) { p = p || profileGet(); return (firstName(p).charAt(0) + lastName(p).charAt(0)).toUpperCase(); }
  /* "Sarah W." (People: "Show my name as …") */
  function shortName(p) { p = p || profileGet(); var l = lastName(p); return firstName(p) + (l ? ' ' + l.charAt(0).toUpperCase() + '.' : ''); }
  function primaryEmail(p) { p = p || profileGet(); var e = p.emails.filter(function (x) { return x.primary; })[0] || p.emails[0]; return e ? e.addr : PROFILE_DEFAULTS.emails[0].addr; }
  /* A sample record's name as the page shows it: the persona's key becomes the profile's full name. */
  function display(name) { return name === PERSONA ? fullName() : name; }
  /* A profile field where a page's sample shows a different value (e.g. the event roster's phone): the sample value until
     the profile's value has been changed from its default. */
  function fieldOr(key, sample) { var v = profileGet()[key]; return v !== PROFILE_DEFAULTS[key] ? v : sample; }

  window.FMSCData = {
    profile: { KEY: PROFILE_KEY, EVENT: PROFILE_EVENT, PERSONA: PERSONA, DEFAULTS: PROFILE_DEFAULTS, get: profileGet, save: profileSave,
      firstName: firstName, lastName: lastName, fullName: fullName, initials: initials, shortName: shortName,
      primaryEmail: primaryEmail, display: display, fieldOr: fieldOr },
    people: PEOPLE,
    TODAY: TODAY, MONTHS_AP: MONTHS_AP, WEEKDAYS: WEEKDAYS, PATHS: PATHS,
    sites: SITES, DEFAULT_SITE: DEFAULT_SITE, MAIN_PHONE: MAIN_PHONE, siteSlug: siteSlug, site: site, isOpen: isOpen,
    samples: SAMPLES, BLANK_GROUP: BLANK_GROUP,
    spotsText: spotsText, pad2: pad2, arriveTime: arriveTime, startTime: startTime, dateParts: dateParts,
    daysFromToday: daysFromToday, daysAwayText: daysAwayText, resolve: resolve, linkNote: linkNote,
    reservations: { KEY: RES_KEY, list: list, get: get, latest: latest, save: save, update: update, newId: newId,
      describe: describe, toFlow: toFlow, sortByDate: sortByDate, SAMPLE: SAMPLE_RESERVATION }
  };
})();
