/* Account shell — shared by the six account pages (Figma: Desktop/Account/* and Mobile/Account/*).
   Load after ds/bundle.js and site-nav.js. Usage (see build/ACCOUNT_BRIEF.md):

     h(window.AccountShell, { current: 'dashboard' }, ...contentChildren)

   current: 'dashboard' | 'people' | 'volunteering' | 'giving' | 'profile' | 'marketplace'.
   Renders the signed-in SiteNav, the account layout (subnav + content), the children, and the Footer.

   Bands
   - >= 940px: desktop. DS AccountSubnav rail (180px) + content column (Figma "Account shell": section-y × margin-x
     padding, content column padded card-pad on the left, sections section-gap apart).
   - < 940px (600–939 and mobile): the 48px account menu button sits above the content and opens the six-item
     account menu (Figma "Account menu · <page>"). Same switch point as the nav's hamburger.
   - < 600px: responsive tokens switch to mobile values (margin-x 16, section-y 32, section-gap 24, card-pad 16).

   Also exposes window.AccountUI — small building blocks with the shared account styles (ac- classes below):
   Card, CardHeader, Panel, Row, Badge. Pages add their own layout with a page prefix (ad- dashboard, …). */
(function () {
  var h = React.createElement, Fragment = React.Fragment, F = window.FMSC;

  var PAGES = [
    { key: 'dashboard', label: 'Dashboard', href: 'account-dashboard.html' },
    { key: 'people', label: 'People & groups', href: 'account-people.html' },
    { key: 'volunteering', label: 'Volunteering', href: 'account-volunteering.html' },
    { key: 'giving', label: 'Giving', href: 'account-giving.html' },
    { key: 'profile', label: 'Profile & settings', href: 'account-profile.html' },
    /* Figma Account subnav (Oct. 27, 2026): sixth item, MarketPlace purchases. */
    { key: 'marketplace', label: 'MarketPlace purchases', href: 'account-marketplace.html' }
  ];
  var NARROW = '(max-width: 939.98px)';

  /* Shared account styles. DS tokens only. Injected once so every account page gets identical rhythm. */
  var CSS = [
    /* Layout */
    '.ac-shell { padding: var(--section-y) var(--margin-x); }',
    '.ac-shell__inner { display: flex; align-items: flex-start; width: 100%; max-width: var(--content-width); margin: 0 auto; }',
    '.ac-shell__rail { flex: none; }',
    '.ac-shell__content { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: var(--section-gap); padding-left: var(--card-pad); container: ac-content / inline-size; }',
    '@media (max-width: 939.98px) {',
    '  .ac-shell__inner { flex-direction: column; align-items: stretch; gap: var(--section-gap); }',
    '  .ac-shell__content { padding-left: 0; }',
    '}',
    '@media (max-width: 599.98px) { .ac-shell__inner { gap: var(--section-gap); } }',

    /* Account menu (below 940px): DS Dropdown field look + Figma "Account menu" list of links */
    '.ac-menu .fm-dropdown__anchor { width: 100%; }',
    '.ac-menu__panel { position: absolute; z-index: 20; top: calc(100% + var(--space-2xs)); left: 0; right: 0; overflow: hidden; background: var(--background-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); }',
    '.ac-menu__list { list-style: none; margin: 0; padding: 0; }',
    '.ac-menu__item { display: flex; align-items: center; min-height: 48px; box-sizing: border-box; padding: 0 var(--space-md); color: var(--content-secondary); text-decoration: none; }',
    '.ac-menu__item:hover { background: var(--background-subtle); color: var(--content-primary); }',
    '.ac-menu__item--current { background: var(--background-subtle); color: var(--content-primary); }',

    /* Cards: surface card with 1px subtle stroke in the layout, card-pad, radius-lg, shadow-md; children space-sm apart */
    '.ac-card { box-sizing: border-box; display: flex; flex-direction: column; gap: var(--space-sm); min-width: 0; padding: var(--card-pad); background: var(--background-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); color: var(--content-primary); }',
    '.ac-card--brand { background: var(--background-brand); color: var(--content-on-brand); }',
    '.ac-card__header { display: flex; align-items: center; gap: var(--space-sm); padding-bottom: var(--space-sm); }',
    '.ac-card__title { margin: 0; flex: 1 1 0; min-width: 0; color: var(--content-primary); }',
    '.ac-card--brand .ac-card__title { color: var(--content-on-brand); }',

    /* Panel: brand-subtle opening block that holds the H1 (Dashboard "Your impact so far") */
    '.ac-panel { box-sizing: border-box; display: flex; flex-direction: column; gap: var(--space-lg); padding: var(--card-pad); background: var(--background-brand-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }',
    '.ac-panel__title { margin: 0; color: var(--content-primary); }',
    '@media (max-width: 599.98px) { .ac-panel { gap: var(--space-md); } }',

    /* Badge: DS IconBadge (Brand, Small); on a brand card the circle is canvas white with a brand icon */
    '.ac-badge--on-brand.fm-icon-badge { background: var(--background-canvas); color: var(--brand-primary); }',
    '.ac-mask-icon { display: inline-block; width: 32px; height: 32px; background: currentColor; -webkit-mask: var(--ac-mask) center / contain no-repeat; mask: var(--ac-mask) center / contain no-repeat; }',

    /* Rows: label left, value right, space-sm vertical padding; every row after the first gets a 1px top rule */
    '.ac-rows { display: flex; flex-direction: column; gap: var(--space-sm); }',
    '.ac-rows--tight { gap: var(--space-2xs); }',
    '.ac-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); padding: var(--space-sm) 0; min-width: 0; }',
    '.ac-row + .ac-row, .ac-row--rule { border-top: 1px solid var(--border-subtle); }',
    '.ac-card--brand .ac-row + .ac-row { border-top-color: color-mix(in srgb, var(--content-on-brand) 30%, transparent); }',
    '.ac-row__label { min-width: 0; color: var(--content-secondary); }',
    '.ac-row__value { flex: none; text-align: right; color: var(--content-primary); }',
    '.ac-card--brand .ac-row__label, .ac-card--brand .ac-row__value { color: var(--content-on-brand); }',

    /* DS fix: Footer Mobile keeps the desktop flex-basis (140px) on its stacked columns, which becomes height. */
    '@media (max-width: 599.98px) { .fm-footer--mobile .fm-footer__col, .fm-footer--mobile .fm-footer__brand { flex: none; min-width: 0; } }',
    /* Figma footer legal + address run 968px wide; the DS caps the column narrower. */
    '.fm-footer--desktop .fm-footer__legal-copy { max-width: 968px; }'
  ].join('\n');
  if (!document.getElementById('ac-shell-css')) {
    var st = document.createElement('style'); st.id = 'ac-shell-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function pageOf(key) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].key === key) return PAGES[i]; return PAGES[0]; }

  /* Below 940px: menu button (DS Dropdown field look, Figma "Account switcher") + list of page links. */
  function AccountMenu(props) {
    var cur = pageOf(props.current);
    var s = React.useState(false), open = s[0], setOpen = s[1];
    var rootRef = React.useRef(null), btnRef = React.useRef(null);
    React.useEffect(function () {
      if (!open) return undefined;
      function onDoc(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
      function onKey(e) { if (e.key === 'Escape') { setOpen(false); if (btnRef.current) btnRef.current.focus(); } }
      document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);
    return h('nav', { className: 'ac-menu', 'aria-label': 'Account', ref: rootRef },
      h('div', { className: 'fm-dropdown' + (open ? ' fm-dropdown--open' : '') },
        h('div', { className: 'fm-dropdown__anchor' },
          h('button', {
            type: 'button', ref: btnRef, className: 'fm-dropdown__box fm-focusable', 'aria-expanded': open ? 'true' : 'false',
            'aria-controls': 'ac-menu-list', 'aria-label': 'Account menu: ' + cur.label,
            onClick: function () { setOpen(!open); }
          },
            h('span', { className: 'fm-dropdown__value body-base' }, cur.label),
            h(F.Icon, { name: open ? 'chevron-up' : 'chevron-down', size: 20, className: 'fm-dropdown__chevron' })),
          open ? h('div', { className: 'ac-menu__panel' },
            h('ul', { className: 'ac-menu__list', id: 'ac-menu-list' },
              PAGES.map(function (p) {
                var on = p.key === cur.key;
                return h('li', { key: p.key },
                  h('a', { className: 'ac-menu__item label-small fm-focusable' + (on ? ' ac-menu__item--current' : ''), href: p.href, 'aria-current': on ? 'page' : undefined }, p.label));
              }))) : null)));
  }

  function AccountShell(props) {
    var narrow = F.useMediaQuery(NARROW);
    var cur = pageOf(props.current);
    var img = function (n) { return 'img/' + n; };
    return h(Fragment, null,
      h(window.SiteNav, { current: 'account' }),
      h('main', { className: 'ac-shell', id: 'main' },
        h('div', { className: 'ac-shell__inner' },
          narrow
            ? h(AccountMenu, { current: cur.key })
            : h('div', { className: 'ac-shell__rail' },
                h(F.AccountSubnav, { breakpoint: 'desktop', current: cur.label, items: PAGES.map(function (p) { return { label: p.label, href: p.href }; }) })),
          h('div', { className: 'ac-shell__content' }, props.children))),
      h(F.Footer, {
        breakpoint: 'auto',
        logoSrc: img('fmsc-logo-text-only.png'),
        /* Same columns as the other pages (Figma footer copy differs from the DS defaults); Account links wired. */
        columns: [
          { title: 'About FMSC', links: [{ label: 'Our mission', href: 'mission.html' }, 'Our story', 'What’s in a meal', 'Locations', 'Our finances', 'Leadership and board', 'Careers', 'News', 'Contact us'] },
          { title: 'Ways to help', links: [{ label: 'Volunteer at a packing event', href: 'volunteer.html' }, { label: 'Donate once or monthly', href: 'donate.html' }, { label: 'Start a fundraiser', href: 'fundraiser.html' }, { label: 'Shop FMSC MarketPlace™', href: 'marketplace.html' }, { label: 'Host an FMSC MobilePack™ event', href: 'host-mobilepack.html' }, { label: 'Attend a fundraising event', href: 'fundraising-events.html' }, { label: 'Plan an estate gift', href: 'estate-gift.html' }, { label: 'Corporate partnerships', href: 'corporate-partnerships.html' }] },
          { title: 'Resources', links: ['Common questions', 'Annual report', 'Food aid requests', 'Request a speaker', 'Partner resources', 'Press'] },
          { title: 'Account', links: [{ label: 'Sign in', href: 'sign-in.html' }, { label: 'Your impact', href: 'account-dashboard.html' }, { label: 'Receipts and tax documents', href: 'account-giving.html' }] },
          { title: 'Stay in touch', links: ['Email updates', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn'] }
        ],
        seals: [img('seal-charity-navigator.png'), img('seal-candid.svg')]
      }));
  }
  AccountShell.pages = PAGES;

  /* ---- AccountUI building blocks ---- */
  /* Badge: DS IconBadge (Brand, Small). icon = DS icon name, or mask = an image URL drawn in the icon colour
     (for Figma icons the coded DS lacks, e.g. Donations/recurring → img/donations-recurring.svg). */
  function Badge(p) {
    var icon = p.mask ? h('span', { className: 'ac-mask-icon', style: { '--ac-mask': 'url(' + p.mask + ')' } }) : p.icon;
    return h(F.IconBadge, { color: 'brand', size: 'small', icon: icon, className: p.onBrand ? 'ac-badge--on-brand' : undefined });
  }
  /* CardHeader: badge + card title (Heading/H4, -mobile below 600). Title is an h2 by default. */
  function CardHeader(p) {
    var mobile = F.useIsMobile();
    return h('div', { className: 'ac-card__header' },
      h(Badge, { icon: p.icon, mask: p.mask, onBrand: p.tone === 'brand' }),
      h(p.as || 'h2', { className: 'ac-card__title ' + (mobile ? 'heading-h4-mobile' : 'heading-h4'), id: p.id }, p.title));
  }
  /* Card: tone 'surface' (default) or 'brand'. Pass title/icon to get the header. */
  function Card(p) {
    var id = p.id || (p.title ? 'ac-' + String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined);
    return h(p.as || 'section', { className: 'ac-card' + (p.tone === 'brand' ? ' ac-card--brand' : '') + (p.className ? ' ' + p.className : ''), 'aria-labelledby': p.title ? id : undefined },
      p.title ? h(CardHeader, { icon: p.icon, mask: p.mask, title: p.title, tone: p.tone, id: id, as: p.titleAs }) : null,
      p.children);
  }
  /* Panel: brand-subtle opening block holding the page H1. */
  function Panel(p) {
    var mobile = F.useIsMobile();
    return h('section', { className: 'ac-panel' + (p.className ? ' ' + p.className : ''), 'aria-labelledby': 'ac-page-title' },
      h('h1', { className: 'ac-panel__title ' + (mobile ? 'heading-h1-mobile' : 'heading-h1'), id: 'ac-page-title' }, p.title),
      p.children);
  }
  /* Row: label + value. labelClass/valueClass pick the text styles (default body-base both). */
  function Row(p) {
    return h('div', { className: 'ac-row' + (p.className ? ' ' + p.className : '') },
      h('span', { className: 'ac-row__label ' + (p.labelClass || 'body-base') }, p.label),
      h('span', { className: 'ac-row__value ' + (p.valueClass || 'body-base') }, p.value));
  }
  window.AccountShell = AccountShell;
  window.AccountUI = { Card: Card, CardHeader: CardHeader, Panel: Panel, Row: Row, Badge: Badge, Menu: AccountMenu, pages: PAGES };
})();
