/* Volunteer sign-up flow shell — shared by signup-1 and every path page (signup-a2 … signup-d4).
   Figma: Desktop/How to Help/Volunteer/Sign up — 1, A2–A4, B2–B4, C2–C4, D2–D4 (file fOODAu37yiozbgq4YOkinU) and the
   matching Mobile frames. Load after ds/bundle.js and site-nav.js. Full guide: build/SIGNUP_BRIEF.md.

     h(window.SignupShell, { path: 'a', step: 2, answers: { 2: 'Just me · 1 spot' }, summary: { spotsValue: 'Not chosen yet' } },
       ...open step body)

   Props
   - path: 'a' | 'b' | 'c' | 'd'. Who is signing up: a = just me, b = an existing group (Grace Church Youth Group),
     c = a new family group (Whitfield Household), d = a new church youth group (Faith Lutheran Confirmation Class).
     Drives the Change links and SignupShell.href(). signup-1 passes SignupShell.currentPath().
   - step: 1 | 2 | 3 | 4. Steps before it render Done (answer + Change), the step itself renders Open inside a step card
     with your children as its body, later steps render Upcoming. 4 = confirmation: no step cards, your children render
     as the content row under the event block (use SignupUI.Confirmation).
   - answers: { 1: '…', 2: '…' } overrides the Done answers (default: the user's answers from the flow store,
     e.g. 'Saturday, Oct. 3 · 9–11 a.m.' and 'Whitfield Household · 4 spots'; Figma samples when nothing is stored).
   - Flow store: SignupShell.flow (get/set/clear/resolve(path)) and SignupShell.useFlow() — see "flow store" below.
   - summary: ReservationSummary props for the mobile "Show details" bar under the event facts (below 600px only;
     the desktop frames show no summary until the confirmation). Pass false to leave it out (step 4 places its own).
   - stepTitles: optional { 2: '…' } to rename a step for a path.

   Renders: SiteNav (signed in or out by itself, from window.FMSCAuth) · main (event header with the page H1, event facts, mobile summary bar, steps) · Footer.
   Bands: ≥ 940 desktop · 600–939 the same layout stacked (container queries on su-content) · < 600 mobile frame
   (responsive tokens switch; F.useIsMobile() picks the Mobile variants).

   window.SignupUI — shared blocks (su- classes): StepCard, Actions, WhoChoice, Guidelines, Waiver, Confirmation,
   ConfirmTitle, ConfirmLinks, EventHeader, EventFacts, Note, Rule. Per-path page classes use sa- / sb- / sc- / sd-.
   Needs flow-data.js (window.FMSCData: site catalog, formatting, saved reservations) loaded before it.
   Shell CSS is injected after the page <style>; override an su- rule with two classes (.su-card.sb-group). */
(function () {
  var h = React.createElement, Fragment = React.Fragment, F = window.FMSC;

  var PATHS = ['a', 'b', 'c', 'd'];
  var STEPS = [
    { n: 1, title: 'Pick a packing time', change: 'Change packing time' },
    { n: 2, title: 'Who’s coming?', change: 'Change who’s coming' },
    { n: 3, title: 'Volunteer guidelines and waiver', change: 'Change guidelines and waiver' }
  ];
  var EVENT = {
    title: 'Pack meals at FMSC Coon Rapids', tag: 'Permanent site',
    back: { label: 'Back to search results', href: 'volunteer.html' },
    facts: [
      { icon: 'map-pin', text: '401 93rd Ave. NW, Coon Rapids', link: { label: 'Get directions', href: '#' } },
      { icon: 'clock', text: 'Two-hour shift', detail: 'Arrive 10–15 minutes early' },
      { icon: 'phone', text: 'Questions or a special needs group?', link: { label: '763-951-7308', href: 'tel:+17639517308' } }
    ]
  };
  /* Mobile summary bar defaults (Figma "Reservation summary / Status=In progress, Breakpoint=Mobile, State=Collapsed"). */
  var SUMMARY = {
    status: 'in-progress', state: 'collapsed', shortSummary: 'Oct. 3 · 9–11 a.m. · Coon Rapids', month: 'Oct', day: '3',
    whenValue: 'Saturday, Oct. 3 · 9–11 a.m.', whereValue: 'FMSC Coon Rapids', showGroup: false, spotsValue: 'Not chosen yet'
  };

  /* ---- routing ---- */
  /* Path chosen for this visit: ?path=b on signup-1 (entry links and test scenarios), else the last path visited
     in this tab, else 'a'. Path pages call remember() so "Change" back to step 1 returns to the same path. */
  var KEY = 'fmsc-signup-path';
  function valid(p) { return PATHS.indexOf(p) >= 0 ? p : null; }
  function remember(p) { try { sessionStorage.setItem(KEY, p); } catch (e) { /* storage blocked: routing falls back to ?path */ } }
  function currentPath() {
    var q = null;
    try { q = valid(new URLSearchParams(location.search).get('path')); } catch (e) { q = null; }
    if (q) { remember(q); return q; }
    try { q = valid(sessionStorage.getItem(KEY)); } catch (e) { q = null; }
    return q || 'a';
  }
  /* href(path, step): step 1 is shared (signup-1.html?path=x); steps 2–4 are signup-<path><step>.html. */
  function href(path, step) { return step === 1 ? 'signup-1.html?path=' + path : 'signup-' + path + step + '.html'; }
  /* Keep the reader's place between steps (Jonny, Oct. 22, 2026): every move to another sign-up page (Continue,
     Change, Back, path switches) saves the scroll position, and the next sign-up page restores it once it renders,
     instead of opening at the top. Only sign-up → sign-up moves are kept; anything else opens at the top as usual. */
  var SCROLL_KEY = 'fmsc-signup-scroll';
  function isSignup(url) {
    try { var u = new URL(url, location.href); return u.origin === location.origin && /\/signup-[a-z0-9]+\.html$/.test(u.pathname); }
    catch (e) { return false; }
  }
  function saveScroll(url) {
    if (!isSignup(url)) return;
    try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ y: window.scrollY, to: new URL(url, location.href).pathname })); } catch (e) { /* storage blocked: opens at top */ }
  }
  function go(url) { saveScroll(url); window.location.href = url; }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && !a.target) saveScroll(a.href);
  });
  /* "Link for this shift" (DS Invite link field on B4/C4/D4) opens the public event page (Jonny, Oct. 27, 2026), as on the
     event details pages. The field stays the DS read-only input; a click, or Enter on it, navigates. */
  function linkToSummary(e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('fm-invite__url') || !t.closest('.su-shell')) return;
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    window.location.href = 'event-summary.html';
  }
  document.addEventListener('click', linkToSummary);
  document.addEventListener('keydown', linkToSummary);
  var arrivedInFlow = false; /* set when this page was opened by a move from another sign-up page (see flow store below) */
  (function restoreScroll() {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null'); sessionStorage.removeItem(SCROLL_KEY); } catch (e) { saved = null; }
    if (saved && saved.to === location.pathname) arrivedInFlow = true;
    if (!saved || saved.to !== location.pathname || !(saved.y > 0)) return;
    window.__fmscKeepScroll = true; /* tells site-nav.js not to reset this page to the top */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var y = saved.y, start = Date.now(), moved = false;
    function onUser() { moved = true; }
    window.addEventListener('wheel', onUser, { passive: true, once: true });
    window.addEventListener('touchstart', onUser, { passive: true, once: true });
    window.addEventListener('keydown', onUser, { once: true });
    /* The page renders with React and web fonts, so keep re-applying until it is tall enough (or ~1.5s pass). */
    (function tick() {
      if (moved) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.min(y, Math.max(0, max)));
      if ((max >= y && Math.abs(window.scrollY - y) < 2 && Date.now() - start > 300) || Date.now() - start > 1500) return;
      requestAnimationFrame(tick);
    })();
  })();

  /* ---- flow store: what the user picked and typed (Jonny, Oct. 22, 2026) ----
     Every step-1–3 control reads its value from here and writes back on change, and everything that repeats an
     earlier answer (Done-step answers, summary card and mobile bar, Reserve label, confirmations) reads it too.
     sessionStorage (this tab) with an in-memory fallback when storage is blocked. Keys (all optional; missing = the
     Figma sample value, see resolve()):
       day (1–31, Oct. 2026) · time ('9–11 a.m.') · spotsLeft ('18 spots left')            — step 1
       who ('me'|'group') · groupName (new group; '' = left blank) · groupType · under18 ('Yes'|'No')
       spots (number; unset = the path's sample count) · packing ('yes'|'no') · done2 (Continue pressed on step 2) — step 2
       waiver (bool)                                                                         — step 3
     Arriving from outside the flow (Volunteer page, home, account pages, a typed or scenario link) starts fresh;
     moves between sign-up pages (Continue, Change, Back, path switches) and reloads keep the answers. */
  var FLOW_KEY = 'fmsc-signup-flow';
  var memFlow = {};
  function readFlow() {
    try { var o = JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; }
    catch (e) { return Object.assign({}, memFlow); }
  }
  function writeFlow(patch) {
    var next = Object.assign(readFlow(), patch || {});
    memFlow = next;
    try { sessionStorage.setItem(FLOW_KEY, JSON.stringify(next)); } catch (e) { /* storage blocked: memory only */ }
    return next;
  }
  var enteredFromOutside = null; /* referrer of a fresh entry ('' when typed); null when moving inside the flow */
  function clearFlow() { memFlow = {}; try { sessionStorage.removeItem(FLOW_KEY); } catch (e) { /* storage blocked */ } }
  (function startFreshFromOutside() {
    var keep = arrivedInFlow;
    try { var nav = performance.getEntriesByType('navigation')[0]; if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) keep = true; } catch (e) { /* no timing API */ }
    if (!keep && document.referrer && isSignup(document.referrer)) keep = true;
    if (!keep) { clearFlow(); enteredFromOutside = document.referrer || ''; }
  })();

  /* ---- packing sites, formatting and saved reservations live in flow-data.js (window.FMSCData, load it first) ----
     Entry links pass ?site=<slug> (signup-1.html?path=a&site=eagan); the slug is kept in the flow store as `site`.
     No site and nothing stored = Coon Rapids, the Figma frames. */
  var D = window.FMSCData;
  var SITES = D.sites, isOpen = D.isOpen, siteSlug = D.siteSlug, BLANK_GROUP = D.BLANK_GROUP, SAMPLES = D.samples;
  var spotsText = D.spotsText, linkNote = D.linkNote;
  /* currentSite(): the stored site (entry links set it from ?site=), else Coon Rapids. */
  function currentSite() { return D.site(readFlow().site); }
  (function resumeReservation() {
    /* "Change reservation" on the event page reopens the flow with ?resume=<id>: load that reservation's answers into the
       flow store (instead of the fresh start above), so finishing the flow updates the same reservation. A reload keeps
       whatever the user has changed since (the store already holds that reservation). */
    var id = null;
    try { id = new URLSearchParams(location.search).get('resume'); } catch (e) { id = null; }
    var r = id ? D.reservations.get(id) : null;
    if (!r || readFlow().resId === id) return;
    clearFlow(); writeFlow(D.reservations.toFlow(r));
  })();
  (function takeSiteFromLink() {
    /* ?site=<slug> on an entry link picks the site (after the fresh start above). A different site drops the picked date. */
    var q = null;
    try { q = siteSlug(new URLSearchParams(location.search).get('site')); } catch (e) { q = null; }
    if (q && q !== readFlow().site) {
      var f = readFlow(); f.site = q; delete f.day;
      clearFlow(); writeFlow(f);
    }
  })();
  /* "Back to search results" returns to the page the user entered the flow from (Jonny, Oct. 22, 2026): remembered on a
     fresh entry from another page of this site; typed links and unknown referrers fall back to volunteer.html. */
  var ENTRY_KEY = 'fmsc-signup-entry';
  function entryHref() { try { return sessionStorage.getItem(ENTRY_KEY) || EVENT.back.href; } catch (e) { return EVENT.back.href; } }
  (function rememberEntry() {
    if (enteredFromOutside === null) return;
    var to = EVENT.back.href;
    try {
      var u = new URL(enteredFromOutside, location.href);
      if (u.origin === location.origin && !isSignup(u.href) && /\.html$/.test(u.pathname)) to = u.pathname.split('/').pop() + u.search + u.hash;
    } catch (e) { /* no referrer: default */ }
    try { sessionStorage.setItem(ENTRY_KEY, to); } catch (e) { /* storage blocked: default */ }
  })();
  function eventFor(site) {
    var digits = site.phone.replace(/\D/g, '');
    return {
      title: site.title, tag: site.tag, back: { label: EVENT.back.label, href: entryHref() },
      facts: [
        { icon: 'map-pin', text: site.address, link: site.directions ? { label: 'Get directions', href: '#' } : null },
        EVENT.facts[1],
        { icon: 'phone', text: EVENT.facts[2].text, link: { label: site.phone, href: 'tel:+1' + digits } }
      ]
    };
  }
  /* resolve(path): stored answers with the Figma samples filled in, plus every formatted string the pages show. */
  function resolve(path) { return D.resolve(readFlow(), valid(path) || 'a'); }

  /* ---- saving the reservation (step 4) ----
     saveReservation(path, patch): called when a confirmation page renders. Upserts by the flow's resId (made here on
     first save, or carried in by ?resume=), so re-rendering or reloading never duplicates. patch: { added, claimed }. */
  function saveReservation(path, patch) {
    var f = readFlow(), r = resolve(path), id = f.resId;
    if (!id) { id = D.reservations.newId(); writeFlow({ resId: id }); }
    var added = (patch && patch.added) || f.added || [];
    if (patch && patch.added) writeFlow({ added: added.slice() });
    var dp = D.dateParts(r.year, r.monthIndex, r.day);
    return D.reservations.save({
      id: id, path: r.path, site: r.site.slug, year: r.year, month: r.monthIndex, day: r.day, date: dp.iso, time: r.time, arrive: r.arrive,
      group: r.group, groupType: r.groupType, under18: r.path === 'c' || r.path === 'd' ? r.under18 : null, packing: r.packing,
      spots: r.spots, claimed: r.claimedBase + added.length, added: added.slice(), linkUrl: r.path === 'a' ? null : r.linkUrl, code: r.path === 'a' ? null : r.code
    });
  }
  /* Names added on this reservation so far (kept in the flow store, so a reload or a resumed reservation keeps them). */
  function addedNames() { var a = readFlow().added; return Array.isArray(a) ? a.slice() : []; }
  /* "See your reservation" link for the saved reservation. */
  function reservationHref() { var id = readFlow().resId; return id ? 'event-upcoming.html?res=' + encodeURIComponent(id) : 'event-upcoming.html'; }
  /* useFlow(): [stored answers, update(patch)] — update writes the store and re-renders the page. */
  function useFlow() {
    var st = React.useState(readFlow), v = st[0], setV = st[1];
    var update = React.useCallback(function (patch) { setV(writeFlow(patch)); }, []);
    return [v, update];
  }
  var Flow = { get: readFlow, set: writeFlow, clear: clearFlow, resolve: resolve, spotsText: spotsText, linkNote: linkNote, BLANK_GROUP: BLANK_GROUP, samples: SAMPLES,
    saveReservation: saveReservation, added: addedNames, reservationHref: reservationHref };

  var CSS = [
    /* Page frame: section-y × margin-x, content capped at content-width, blocks section-gap apart. su-content is the
       size container every in-flow layout decision uses (1200 at 1440, 700 at 940, 361 at 393). */
    '.su-shell { padding: var(--section-y) var(--margin-x); }',
    '.su-shell__inner { display: flex; flex-direction: column; gap: var(--section-gap); width: 100%; max-width: var(--content-width); margin: 0 auto; container: su-content / inline-size; }',
    '.su-event, .su-steps { display: flex; flex-direction: column; min-width: 0; }',
    '.su-event { gap: var(--space-md); }',
    '.su-steps { gap: var(--grid-gap); }',

    /* Cards: surface, 1px subtle stroke inside the box, card-pad, radius-lg, shadow-md. Step cards space their rows space-lg. */
    '.su-card { box-sizing: border-box; display: flex; flex-direction: column; gap: var(--space-lg); min-width: 0; padding: var(--card-pad); background: var(--background-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); color: var(--content-primary); }',

    /* Event header: DS Account page header markup; Figma uses the mobile "Back to …" breadcrumb at every width. */
    '.su-header .fm-account-header__crumbs { align-self: flex-start; }',

    /* Event facts: three columns space-lg apart; stacked space-md apart when the content column is narrow. */
    '.su-facts { flex-direction: row; gap: var(--space-lg); }',
    '.su-fact { flex: 1 1 0; min-width: 0; display: flex; align-items: flex-start; gap: var(--space-sm); }',
    '.su-fact__icon { flex: none; color: var(--graphic-ink); }',
    '.su-fact__text { display: flex; flex-direction: column; gap: var(--space-3xs); min-width: 0; }',
    '.su-fact__text p { margin: 0; }',
    '.su-fact__main { color: var(--content-primary); }',
    '.su-fact__detail { color: var(--content-secondary); }',
    '.su-fact__link { color: var(--content-link); text-decoration: underline; align-self: flex-start; }',
    '@container su-content (max-width: 759.98px) { .su-facts { flex-direction: column; gap: var(--space-md); } .su-fact { flex: none; } }',

    /* Shared text blocks */
    '.su-measure { max-width: 607px; }',
    '.su-note { margin: 0; color: var(--content-secondary); }',
    '.su-stack { display: flex; flex-direction: column; gap: var(--space-sm); min-width: 0; }',
    '.su-rule { width: 100%; }',

    /* Actions row: Large primary (and optional back) buttons; full width on mobile. */
    '.su-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-md); }',
    '@media (max-width: 599.98px) { .su-actions { flex-direction: column; align-items: stretch; } .su-actions .fm-btn { width: 100%; } }',

    /* Choice radios ("Just me" / "A group I’m organizing"): space-sm apart */
    '.su-choice { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0; padding: 0; border: 0; min-width: 0; }',
    '.su-choice .fm-radio { align-self: flex-start; }',

    /* Guidelines: bullet + text rows space-sm apart, text capped at 607 (Figma measure) */
    '.su-guidelines { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0; padding: 0; list-style: none; }',
    '.su-guideline { display: flex; gap: var(--space-sm); }',
    '.su-guideline__bullet { flex: none; color: var(--content-secondary); }',
    '.su-guideline__text { min-width: 0; max-width: 607px; color: var(--content-primary); }',
    '.su-links { display: flex; flex-wrap: wrap; gap: var(--space-lg); }',
    '@media (max-width: 599.98px) { .su-links { flex-direction: column; align-items: flex-start; gap: var(--space-sm); } }',
    '.su-waiver { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-sm); }',

    /* Confirmation (step 4): card + 384 summary card grid-gap apart; mobile bar above the card. Stacks under 840 content. */
    '.su-confirm { display: flex; align-items: flex-start; gap: var(--grid-gap); min-width: 0; }',
    '.su-confirm > .su-card { flex: 1 1 0; }',
    '.su-confirm > .fm-reservation-summary--desktop { flex: none; max-width: 100%; }',
    '@container su-content (max-width: 839.98px) { .su-confirm { flex-direction: column; align-items: stretch; } }',
    '@media (max-width: 599.98px) { .su-confirm { flex-direction: column; align-items: stretch; gap: var(--grid-gap); } }',
    '.su-confirm-title { display: flex; align-items: flex-start; gap: var(--space-md); }',
    '.su-confirm-title__text { display: flex; flex-direction: column; gap: var(--space-xs); min-width: 0; }',
    '.su-confirm-title__heading { margin: 0; color: var(--content-primary); }',
    '.su-confirm-title__body { margin: 0; max-width: 607px; color: var(--content-secondary); overflow-wrap: anywhere; }',
    '.su-confirm-links { display: flex; flex-direction: column; gap: var(--space-sm); }',
    '.su-confirm-links__line { margin: 0; max-width: 607px; color: var(--content-secondary); }',

    /* "Link for this shift" opens the public event page: show it as clickable. */
    '.su-shell .fm-invite__url { cursor: pointer; }',

    /* DS fix (same as account pages): Footer Mobile keeps the desktop flex-basis on its stacked columns. */
    '@media (max-width: 599.98px) { .fm-footer--mobile .fm-footer__col, .fm-footer--mobile .fm-footer__brand { flex: none; min-width: 0; } }'
  ].join('\n');
  if (!document.getElementById('su-shell-css')) {
    var st = document.createElement('style'); st.id = 'su-shell-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---- SignupUI blocks ---- */
  function cls(a, b) { return b ? a + ' ' + b : a; }

  /* EventHeader: brand-subtle block with the "Back to search results" link, gold tag and the page H1. */
  function EventHeader(p) {
    var mobile = F.useIsMobile();
    var ev = Object.assign({}, EVENT, p || {});
    return h('header', { className: 'fm-account-header su-header' + (mobile ? ' fm-account-header--mobile fm-mobile' : '') },
      h('nav', { className: 'fm-account-header__crumbs', 'aria-label': 'Breadcrumb' },
        h('a', { className: 'fm-account-header__back label-small fm-focusable', href: ev.back.href },
          h(F.Icon, { name: 'chevron-left', size: 16 }), h('span', null, ev.back.label))),
      h('div', { className: 'fm-account-header__body' },
        h('div', { className: 'fm-account-header__heading' },
          ev.tag ? h('span', { className: 'fm-account-header__tag caption' }, ev.tag) : null,
          h('h1', { className: 'fm-account-header__title ' + (mobile ? 'heading-h1-mobile' : 'heading-h1') }, ev.title))));
  }
  /* EventFacts: where / how long / who to call. */
  function EventFacts(p) {
    var facts = (p && p.facts) || EVENT.facts;
    return h('section', { className: 'su-card su-facts', 'aria-label': 'Event details' },
      facts.map(function (f, i) {
        return h('div', { key: i, className: 'su-fact' },
          h(F.Icon, { name: f.icon, size: 20, className: 'su-fact__icon' }),
          h('div', { className: 'su-fact__text' },
            h('p', { className: 'su-fact__main body-base' }, f.text),
            f.detail ? h('p', { className: 'su-fact__detail body-small' }, f.detail) : null,
            f.link ? h('a', { className: 'su-fact__link label-small fm-focusable', href: f.link.href }, f.link.label) : null));
      }));
  }
  /* StepCard: the open step — FlowStep (Open) heading plus the step body, rows space-lg apart. */
  function StepCard(p) {
    return h('section', { className: cls('su-card su-step', p.className), 'aria-label': p.title },
      h(F.FlowStep, { breakpoint: 'auto', state: 'open', number: String(p.number), title: p.title }),
      p.children);
  }
  /* Actions: the Continue (primary, Large) button; optional secondary back button. Full width on mobile.
     Pass href to navigate, or onClick to run checks first. */
  function Actions(p) {
    return h('div', { className: cls('su-actions', p.className) },
      h(F.Button, { variant: 'primary', size: 'large', href: p.href, onClick: p.onClick, type: p.href ? undefined : 'button' }, p.label),
      p.backLabel ? h(F.Button, { variant: 'ghost', size: 'large', href: p.backHref }, p.backLabel) : null);
  }
  /* WhoChoice: the step 2 radios. value 'me' | 'group'. Choosing the other answer moves to that path's step 2
     (me → signup-a2, group → signup-b2 unless groupHref says otherwise); pass onChange to handle it in-page instead. */
  function WhoChoice(p) {
    var value = p.value || 'me';
    function pick(v) {
      if (p.onChange) { p.onChange(v); return; }
      if (v === value) return;
      go(v === 'me' ? href('a', 2) : (p.groupHref || href('b', 2)));
    }
    return h('fieldset', { className: 'su-choice' },
      h('legend', { className: 'fm-visually-hidden' }, 'Who’s coming?'),
      h(F.Radio, { name: 'su-who', value: 'me', label: 'Just me', description: 'One spot, for you.', checked: value === 'me', onChange: function () { pick('me'); } }),
      h(F.Radio, { name: 'su-who', value: 'group', label: 'A group I’m organizing', description: 'Family, church, school, work or friends.', checked: value === 'group', onChange: function () { pick('group'); } }));
  }
  /* Rule: DS Divider without label. */
  function Rule() { return h(F.Divider, { showLabel: false, className: 'su-rule' }); }
  /* Note: body-small (default) or body-base secondary line. */
  function Note(p) { return h('p', { className: cls('su-note ' + (p.size === 'base' ? 'body-base' : 'body-small'), p.className), id: p.id }, p.children); }

  var GUIDELINES = [
    'Volunteers must be at least 5, and everyone under 18 packs alongside an adult who packs too.',
    'Leave jewelry at home. Wedding bands and medical alert bracelets are fine.',
    'Stay home if you’re feeling sick.',
    'Treat everyone at FMSC with respect.'
  ];
  /* Guidelines: the four rules and the two policy links (step 3, all paths). */
  function Guidelines() {
    return h(Fragment, null,
      h('ul', { className: 'su-guidelines' },
        GUIDELINES.map(function (g, i) {
          return h('li', { key: i, className: 'su-guideline body-base' },
            h('span', { className: 'su-guideline__bullet', 'aria-hidden': 'true' }, '•'),
            h('span', { className: 'su-guideline__text' }, g));
        })),
      h('div', { className: 'su-links' },
        h(F.ArrowLink, { href: '#', label: 'Read the code of conduct' }),
        h(F.ArrowLink, { href: '#', label: 'Read the volunteering policies' })));
  }
  /* Waiver: the accept checkbox and "Read the waiver" link. Controlled: checked, onChange(bool), error. */
  function Waiver(p) {
    return h('div', { className: 'su-waiver' },
      h(F.Checkbox, { name: 'su-waiver', label: 'I’ve read the guidelines and accept the volunteer waiver.', checked: !!p.checked, error: !!p.error,
        onChange: function (e) { p.onChange(e.target.checked); } }),
      h(F.ArrowLink, { href: '#', label: 'Read the waiver' }));
  }
  /* ConfirmTitle: success badge + H2 + one line. */
  function ConfirmTitle(p) {
    var mobile = F.useIsMobile();
    return h('div', { className: 'su-confirm-title' },
      h(F.IconBadge, { color: 'success', size: mobile ? 'medium' : 'large', icon: 'check' }),
      h('div', { className: 'su-confirm-title__text' },
        h('h2', { className: 'su-confirm-title__heading ' + (mobile ? 'heading-h3-mobile' : 'heading-h3') }, p.title),
        p.body ? h('p', { className: 'su-confirm-title__body body-base' }, p.body) : null));
  }
  /* ConfirmLinks: the closing line and the reservation arrow links (See your reservation · Add to calendar). */
  function ConfirmLinks(p) {
    return h('div', { className: 'su-confirm-links' },
      h('p', { className: 'su-confirm-links__line body-base' }, p.line),
      h('div', { className: 'su-links' },
        (p.links || []).map(function (l, i) { return h(F.ArrowLink, { key: i, href: l.href || '#', label: l.label }); })));
  }
  /* Confirmation: step 4 content row. Desktop: card (children) + confirmed ReservationSummary card; mobile: the summary
     bar above the card. summary = ReservationSummary props (status confirmed is set for you). */
  function Confirmation(p) {
    var mobile = F.useIsMobile();
    var r = resolve(p.path || currentPath());
    var sum = Object.assign({}, SUMMARY, { status: 'confirmed', whenValue: r.when, whereValue: r.where, shortSummary: r.shortSummary, month: r.month, day: r.dayNum }, p.summary || {});
    var card = h('section', { key: 'card', className: cls('su-card su-confirm__card', p.className), 'aria-labelledby': p.labelledBy }, p.children);
    var summary = h(F.ReservationSummary, Object.assign({ key: 'sum' }, sum, { breakpoint: mobile ? 'mobile' : 'desktop' }));
    return h('div', { className: 'su-confirm' }, mobile ? [summary, card] : [card, summary]);
  }

  /* ---- SignupShell ---- */
  function SignupShell(props) {
    var mobile = F.useIsMobile();
    var path = valid(props.path) || 'a';
    var step = props.step || 1;
    React.useEffect(function () { if (step > 1) remember(path); }, [path, step]);
    /* Meta description names the site and date the user picked (the static text is the Coon Rapids frame). */
    var metaWhere = resolve(path);
    React.useEffect(function () {
      var m = document.querySelector('meta[name="description"]'); if (!m) return;
      if (m.dataset.base == null) m.dataset.base = m.getAttribute('content') || '';
      m.setAttribute('content', m.dataset.base.replace(/FMSC Coon Rapids/g, metaWhere.site.at)
        .replace('Saturday, Oct. 3, 9–11 a.m.', metaWhere.dateLabel + ', ' + metaWhere.time));
    }, [metaWhere.site.at, metaWhere.dateLabel, metaWhere.time]);
    var r = resolve(path), ev = eventFor(r.site);
    var answers = Object.assign({ 1: r.when, 2: r.answer2 }, props.answers || {});
    var titles = props.stepTitles || {};
    /* Mobile bar: date and time from step 1; spots (and group) once step 2 is answered. */
    var picked = step >= 3 || r.done2 ? { spotsValue: r.spotsText, showGroup: path !== 'a', groupValue: r.group || undefined } : {};
    var summary = props.summary === false ? null
      : Object.assign({}, SUMMARY, { whenValue: r.when, whereValue: r.where, shortSummary: r.shortSummary, month: r.month, day: r.dayNum }, picked, props.summary || {});
    var img = function (n) { return 'img/' + n; };

    var steps = step >= 4 ? null : h('div', { className: 'su-steps' },
      STEPS.map(function (s) {
        var title = titles[s.n] || s.title;
        if (s.n < step) {
          return h(F.FlowStep, { key: s.n, breakpoint: 'auto', state: 'done', number: String(s.n), title: title, answer: answers[s.n],
            changeLabel: s.change, onReopen: function () { go(href(path, s.n)); } });
        }
        if (s.n === step) return h(StepCard, { key: s.n, number: s.n, title: title, className: props.stepClassName }, props.children);
        return h(F.FlowStep, { key: s.n, breakpoint: 'auto', state: 'upcoming', number: String(s.n), title: title });
      }));

    return h(Fragment, null,
      h(window.SiteNav, { current: 'volunteer' }),
      h('main', { className: 'su-shell', id: 'main' },
        h('div', { className: 'su-shell__inner' },
          h('div', { className: 'su-event' },
            h(EventHeader, { title: ev.title, tag: ev.tag, back: ev.back }),
            h(EventFacts, { facts: ev.facts }),
            mobile && summary ? h(F.ReservationSummary, Object.assign({}, summary, { breakpoint: 'mobile' })) : null),
          steps || props.children)),
      h(F.Footer, {
        breakpoint: 'auto',
        logoSrc: img('fmsc-logo-text-only.png'),
        /* Sign-up frames' footer copy ("Finances", "Host a MobilePack™ event"); site links wired. */
        columns: [
          { title: 'About FMSC', links: [{ label: 'Our mission', href: 'mission.html' }, 'Our story', 'What’s in a meal', 'Locations', 'Finances', 'Leadership and board', 'Careers', 'News', 'Contact us'] },
          { title: 'Ways to help', links: [{ label: 'Volunteer at a packing event', href: 'volunteer.html' }, { label: 'Donate once or monthly', href: 'donate.html' }, { label: 'Start a fundraiser', href: 'fundraiser.html' }, { label: 'Shop FMSC MarketPlace™', href: 'marketplace.html' }, { label: 'Host a MobilePack™ event', href: 'host-mobilepack.html' }, { label: 'Attend a fundraising event', href: 'fundraising-events.html' }, { label: 'Plan an estate gift', href: 'estate-gift.html' }, { label: 'Corporate partnerships', href: 'corporate-partnerships.html' }] },
          { title: 'Resources', links: ['Common questions', 'Annual report', 'Food aid requests', 'Request a speaker', 'Partner resources', 'Press'] },
          { title: 'Account', links: [{ label: 'Sign in', href: 'sign-in.html' }, { label: 'Your impact', href: 'account-dashboard.html' }, { label: 'Receipts and tax documents', href: 'account-giving.html' }] },
          { title: 'Stay in touch', links: ['Email updates', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn'] }
        ],
        seals: [img('seal-charity-navigator.png'), img('seal-candid.svg')]
      }));
  }
  SignupShell.paths = PATHS;
  SignupShell.steps = STEPS;
  SignupShell.event = EVENT;
  SignupShell.summary = SUMMARY;
  SignupShell.href = href;
  SignupShell.go = go;
  SignupShell.currentPath = currentPath;
  SignupShell.remember = remember;
  SignupShell.flow = Flow;
  SignupShell.sites = SITES;
  SignupShell.site = currentSite;
  SignupShell.isOpen = isOpen;
  SignupShell.useFlow = useFlow;

  window.SignupShell = SignupShell;
  window.SignupUI = {
    EventHeader: EventHeader, EventFacts: EventFacts, StepCard: StepCard, Actions: Actions, WhoChoice: WhoChoice,
    Guidelines: Guidelines, Waiver: Waiver, Rule: Rule, Note: Note,
    Confirmation: Confirmation, ConfirmTitle: ConfirmTitle, ConfirmLinks: ConfirmLinks, useFlow: useFlow
  };
})();
