/* Prototype site navigation, shared by every page so the nav stays identical and every link resolves.
   Pages render: h(SiteNav, { current: 'mission' }) — current marks the active top-level item.
   Signed in or out follows window.FMSCAuth (below); pages may still pass signedIn to force it. Signed in, the desktop
   Account control shows the outlined user icon and opens the account menu, and the mobile menu panel shows the signed-in
   row (first name, links to the dashboard) instead of "Sign in". Signed out, the Account control opens Sign in /
   Create account. The account menu's name and the mobile menu's first name come from the profile store
   (FMSCData.profile, in flow-data.js); with nothing saved they are the persona's: 'Sarah Whitfield', 'Sarah'.
   Sign in and the mobile "Sign in" row open sign-in.html; Create account opens create-account.html. */
(function () {
  /* Every page opens at the top (or at its #anchor). The hosted prototype otherwise carries the previous page's
     scroll position into the next page, so a link low on a long page lands near the bottom of the next one.
     Back/forward keeps the browser's own restore; sign-up steps restore their own position (signup-shell.js). */
  (function openAtTop() {
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    if (nav.type === 'back_forward') return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var start = Date.now(), moved = false;
    function onUser() { moved = true; }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, onUser, { passive: true, once: true }); });
    (function tick() {
      if (moved || window.__fmscKeepScroll) return;
      var id = location.hash && decodeURIComponent(location.hash.slice(1));
      var el = id && document.getElementById(id);
      if (el) el.scrollIntoView(); else if (!id && window.scrollY !== 0) window.scrollTo(0, 0);
      if (Date.now() - start < 1200) requestAnimationFrame(tick);
    })();
  })();
  /* ---- Sign-in state (Figma "Signed in" prototype variable; Jonny, Oct. 27, 2026) ----
     window.FMSCAuth.get() → 'out' | 'sarah' | 'new'. The prototype starts signed out. Sign in → 'sarah' (Sarah's full
     account); Create account → 'new' (Sarah again, with the empty "— New account" account pages). Kept in
     sessionStorage 'fmsc-auth', so a new tab starts signed out. ?auth=out|sarah|new on any URL sets it (for review).
     Link rules, applied to every click on the site so pages keep plain hrefs:
     - signed in:  index.html → home-signed-in.html; sign-in.html / create-account*.html → the account Dashboard
     - signed out: home-signed-in.html → index.html
     - 'new':      account-<page>.html → account-<page>-new.html (the six account pages) */
  var AUTH_KEY = 'fmsc-auth';
  var memAuth = 'out';
  function readAuth() { try { var v = sessionStorage.getItem(AUTH_KEY); return v === 'sarah' || v === 'new' ? v : 'out'; } catch (e) { return memAuth; } }
  function writeAuth(v) { memAuth = v; try { sessionStorage.setItem(AUTH_KEY, v); } catch (e) {} try { window.dispatchEvent(new Event('fmsc-auth')); } catch (e) {} }
  (function fromQuery() { var m = /[?&]auth=(out|sarah|new)\b/.exec(location.search); if (m) writeAuth(m[1]); })();
  var ACCOUNT_PAGES = ['dashboard', 'people', 'volunteering', 'giving', 'profile', 'marketplace'];
  function resolveHref(href, state) {
    if (!href) return href;
    state = state || readAuth();
    var m = /^([^?#]*)(.*)$/.exec(href), file = m[1], rest = m[2];
    if (state !== 'out') {
      if (file === 'index.html') return 'home-signed-in.html' + rest;
      if (file === 'sign-in.html' || /^create-account/.test(file)) return resolveHref('account-dashboard.html', state);
    } else if (file === 'home-signed-in.html') return 'index.html' + rest;
    if (state === 'new') { var a = /^account-([a-z]+)\.html$/.exec(file); if (a && ACCOUNT_PAGES.indexOf(a[1]) >= 0) return 'account-' + a[1] + '-new.html' + rest; }
    return href;
  }
  window.FMSCAuth = {
    get: readAuth,
    set: writeAuth,
    signedIn: function () { return readAuth() !== 'out'; },
    signIn: function () { writeAuth('sarah'); },
    createAccount: function () { writeAuth('new'); },
    signOut: function () { writeAuth('out'); },
    href: resolveHref,
    go: function (href) { location.href = resolveHref(href); }
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var raw = a.getAttribute('href');
    /* Dead links: a link with no page in the prototype yet (href "#" or empty) does nothing, instead of reloading or
       jumping to the top of the current page (Jonny, Oct. 30, 2026). */
    if (raw === '#' || raw === '') { e.preventDefault(); return; }
    var to = resolveHref(raw);
    if (to !== raw) { e.preventDefault(); location.href = to; }
  });
  var h = React.createElement;
  var helpItems = [
    { label: 'Overview', href: 'how-to-help.html' },
    { label: 'Volunteer at a packing event', href: 'volunteer.html' },
    { label: 'Donate once or monthly', href: 'donate.html' },
    { label: 'Start a fundraiser', href: 'fundraiser.html' },
    { label: 'Shop FMSC MarketPlace™', href: 'marketplace.html' },
    { label: 'Host a MobilePack™ event', href: 'host-mobilepack.html' },
    { label: 'Attend a fundraising event', href: 'fundraising-events.html' },
    { label: 'Plan an estate gift', href: 'estate-gift.html' },
    { label: 'Corporate partnerships', href: 'corporate-partnerships.html' }
  ];
  /* Desktop Account dropdown: the DS Account component's default rows, wired to the account pages. */
  var accountItems = [
    { label: 'Dashboard', href: 'account-dashboard.html' },
    { label: 'People & groups', href: 'account-people.html' },
    { label: 'Volunteering', href: 'account-volunteering.html' },
    { label: 'Giving', href: 'account-giving.html' },
    { label: 'Profile & settings', href: 'account-profile.html' },
    /* Figma: Sign out sets "Signed in" to false and opens the signed-out homepage. */
    { label: 'Sign out', href: 'index.html', onClick: function (e) { e.preventDefault(); writeAuth('out'); location.href = 'index.html'; } }
  ];
  function me() {
    var P = window.FMSCData && window.FMSCData.profile;
    return P ? { initials: P.initials(), name: P.fullName(), first: P.firstName(), email: P.primaryEmail() } : { initials: 'SW', name: 'Sarah Whitfield', first: 'Sarah', email: 'sarah.whitfield@gmail.com' };
  }
  function SiteNav(props) {
    props = props || {};
    /* Re-render when Profile and settings saves (the event comes from FMSCData.profile.save). */
    var st = React.useState(me), who = st[0], setWho = st[1];
    var au = React.useState(readAuth), auth = au[0], setAuth = au[1];
    React.useEffect(function () {
      function on() { setWho(me()); }
      function onAuth() { setAuth(readAuth()); }
      window.addEventListener('fmsc-profile', on);
      window.addEventListener('fmsc-auth', onAuth);
      return function () { window.removeEventListener('fmsc-profile', on); window.removeEventListener('fmsc-auth', onAuth); };
    }, []);
    /* Signed in follows the sign-in state unless the page passes signedIn explicitly. */
    var signedIn = props.signedIn != null ? !!props.signedIn : auth !== 'out';
    var acct = function (p) { return resolveHref('account-' + p + '.html', auth); };
    return h(window.FMSC.NavBar, {
      breakpoint: 'auto',
      logoSrc: 'img/fmsc-logo-white-on-blue.png', logoHref: signedIn ? 'home-signed-in.html' : 'index.html',
      links: [
        { label: 'Mission', href: 'mission.html' },
        /* Desktop dropdown copy follows the Figma Nav bar ("Shop FMSC Marketplace" + superscript TM); the mobile panel keeps "MarketPlace™" as its frame shows. */
        { label: 'How to help', href: 'how-to-help.html', items: helpItems.map(function (it) { return it.label === 'Shop FMSC MarketPlace™' ? Object.assign({}, it, { label: 'Shop FMSC Marketplace™' }) : it; }) },
        { label: 'Impact', href: 'impact.html' }
      ],
      volunteerHref: 'volunteer.html', donateHref: 'donate.html',
      accountItems: accountItems.map(function (it) { return it.onClick ? it : Object.assign({}, it, { href: resolveHref(it.href, auth) }); }),
      signedIn: signedIn,
      initials: props.initials || who.initials,
      userName: props.userName || who.name,
      userEmail: props.userEmail || who.email,
      accountProps: { avatar: 'icon', signInHref: 'sign-in.html', createAccountHref: 'create-account.html' }, /* Figma prototype nav shows the outlined user icon even signed in (Jonny, Oct. 23, 2026) */
      panelProps: {
        items: [
          { label: 'Mission', href: 'mission.html' },
          { label: 'How to help', href: 'how-to-help.html', children: helpItems.slice(1) },
          { label: 'Impact', href: 'impact.html' }
        ],
        signedIn: signedIn,
        userName: props.userName ? props.userName.split(' ')[0] : who.first,
        signInHref: 'sign-in.html',
        accountHref: acct('dashboard')
      }
    });
  }
  window.SiteNav = SiteNav;

  /* ---- Toast (Figma "Overlay · Toast", Oct. 27, 2026) ----
     window.FMSCToast.show('Added' | 'Removed'): the DS Toast pill, bottom centre, for 2 seconds (Figma: opens on a
     checkbox click, closes after 2s). Added: feedback-success + check; Removed: feedback-warning + x. The status is also
     announced (role=status). */
  (function toast() {
    var CSS = '.fm-toast-host { position: fixed; left: 50%; bottom: var(--space-lg); z-index: 1000; transform: translateX(-50%); pointer-events: none; }' +
      '.fm-toast { display: inline-flex; align-items: center; gap: var(--space-xs); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-pill); color: var(--content-inverse); box-shadow: var(--shadow-md); animation: fm-toast-in 0.3s ease-out; }' +
      '.fm-toast--added { background: var(--feedback-success); }' +
      '.fm-toast--removed { background: var(--feedback-warning); }' +
      '.fm-toast__icon { flex: none; color: var(--graphic-ink); }' +
      '@keyframes fm-toast-in { from { opacity: 0; } to { opacity: 1; } }' +
      '@media (prefers-reduced-motion: reduce) { .fm-toast { animation: none; } }';
    var host = null, root = null, timer = null, n = 0;
    function ensure() {
      if (host) return;
      if (!document.getElementById('fm-toast-css')) { var st = document.createElement('style'); st.id = 'fm-toast-css'; st.textContent = CSS; document.head.appendChild(st); }
      host = document.createElement('div'); host.className = 'fm-toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host); root = window.ReactDOM.createRoot(host);
    }
    function show(status) {
      ensure();
      var removed = status === 'Removed';
      n += 1;
      root.render(h('div', { key: n, className: 'fm-toast label-base ' + (removed ? 'fm-toast--removed' : 'fm-toast--added') },
        h(window.FMSC.Icon, { name: removed ? 'x' : 'check', size: 24, className: 'fm-toast__icon' }), removed ? 'Removed' : 'Added'));
      clearTimeout(timer);
      timer = setTimeout(function () { root.render(null); }, 2000);
    }
    window.FMSCToast = { show: show };
  })();
})();
