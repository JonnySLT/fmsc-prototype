/* Give (donate) flow shell — shared by give-a1 … give-c4. Load after ds/bundle.js, site-nav.js and flow-data.js.
   Figma: "How to Help/Donate/Give — A1 … C4" (file fOODAu37yiozbgq4YOkinU, pages "Usability test · Desktop / Mobile";
   identical copies in zm5r7JO948TGTKdCE3cQP5 "Designs" › "Donate flow").

   Flows: A = signed in, monthly gift (Sarah Whitfield) · B = signed in, gift to an FMSC MobilePack™ event ·
   C = signed out (Daniel Okafor). Steps: 1 Your gift · 2 Your details · 3 Payment · 4 Confirmation.

     h(window.GiveShell, { head: …, summary: GiveUI.summary(gift, {…}), asideNote: '…', faq: true }, …main content)

   Layout (Figma "Flow shell"): content column (792 at 1440) + 384 aside, grid-gap apart. The head block (page header or
   impact panel) and the main column are section-gap apart. Content narrower than 1000px stacks: head, summary card,
   main. Below 600px (Mobile frames) the summary is the collapsed "Show details" bar: inside the header block on steps
   1–3, between the impact panel and the confirmation on step 4; the FAQ section runs full width after main.

   Gift store (sessionStorage 'fmsc-give'): what the user picked (amount, freq, fee, ded, event, monthly, method). A page
   opened from outside the give pages starts from its own Figma defaults; moves between give pages keep the answers.
   window.GiveUI — shared blocks (gv- classes). Shell CSS is injected after the page <style>. */
(function () {
  var h = React.createElement, Fragment = React.Fragment, F = window.FMSC;

  /* ---- gift store ---- */
  var KEY = 'fmsc-give', NAV_KEY = 'fmsc-give-nav';
  var mem = {};
  function read() { try { var o = JSON.parse(sessionStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return Object.assign({}, mem); } }
  function write(next) { mem = next; try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* storage blocked: memory only */ } return next; }
  function isGive(url) {
    try { var u = new URL(url, location.href); return u.origin === location.origin && /\/give-[a-z0-9-]+\.html$/.test(u.pathname); }
    catch (e) { return false; }
  }
  /* Fresh entry (typed link, another page of the site) → the page's Figma defaults; give → give moves and reloads keep the store. */
  var fresh = (function () {
    var keep = false;
    try { var nav = performance.getEntriesByType('navigation')[0]; if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) keep = true; } catch (e) { /* no timing API */ }
    if (document.referrer && isGive(document.referrer)) keep = true;
    /* The hosted prototype can strip the referrer, so moves between give pages also leave a short-lived flag. */
    try { var t = parseInt(sessionStorage.getItem(NAV_KEY) || '0', 10); if (t && Date.now() - t < 60000) keep = true; sessionStorage.removeItem(NAV_KEY); } catch (e) { /* storage blocked */ }
    return !keep;
  })();
  function markNav() { try { sessionStorage.setItem(NAV_KEY, String(Date.now())); } catch (e) { /* storage blocked */ } }
  /* Any link to another give page (Continue, Change, wallets, Give) marks the move before the page unloads. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (a && isGive(a.getAttribute('href'))) markNav();
  }, true);
  /* Flow defaults: the Figma sample gift of each flow. */
  var DEFAULTS = {
    a: { amount: 106, freq: 'monthly', fee: true, ded: false, event: false, monthly: false, method: 'card' },
    b: { amount: 106, freq: 'once', fee: true, ded: true, event: true, monthly: false, method: 'card' },
    c: { amount: 106, freq: 'once', fee: false, ded: false, event: false, monthly: false, method: 'card' }
  };
  /* Dedication and event samples (Figma B1). */
  var DED = { kind: 'honor', name: 'Maria Lopez', email: 'maria.lopez@gmail.com', notify: true };
  var EVENTS = [
    { id: 'lutheran', label: 'Hope Lutheran Church', short: 'Hope Lutheran', description: 'FMSC MobilePack™ event · Nov. 14–15 · Blaine, MN' },
    { id: 'community', label: 'Hope Community Church', short: 'Hope Community Church', description: 'FMSC MobilePack™ event · Dec. 5–6 · Rochester, MN' },
    { id: 'academy', label: 'Hope Academy', short: 'Hope Academy', description: 'FMSC MobilePack™ event · Jan. 22–23, 2027 · Minneapolis, MN' }
  ];
  function seed(flow, over) {
    /* B1's Figma frame shows the dedication and event search filled in (sample values); on A1 and C1 those fields open
       blank when the box is checked, "Email them" unchecked and no event picked (Jonny, Oct. 29, 2026). */
    var sample = flow === 'b';
    var base = Object.assign({ flow: flow }, DEFAULTS[flow], { dedInfo: sample ? Object.assign({}, DED) : { kind: 'honor', name: '', email: '', notify: false },
      eventId: sample ? 'lutheran' : '', query: sample ? 'Hope' : '' }, over || {});
    /* Fresh entry from another page: ?amount=<dollars>&freq=<once|monthly> carry over what was picked there (the Donate
       module on Homepage, How to Help and Donate, "Join and give monthly", Groups links). give.html passes the query on. */
    if (fresh) {
      fresh = false;
      try {
        var q = new URLSearchParams(location.search), qa = q.get('amount'), qf = q.get('freq');
        if (qa && /^\d{1,7}(\.\d{1,2})?$/.test(qa) && parseFloat(qa) >= 1) base.amount = parseFloat(qa);
        if (qf === 'once' || qf === 'monthly') base.freq = qf;
      } catch (e) { /* no URL API: keep the defaults */ }
      return write(base);
    }
    return write(Object.assign(base, read(), { flow: flow }));
  }
  /* useGift(flow, over): [gift, update(patch)] — update writes the store and re-renders. over: page defaults on top of the
     flow's (e.g. B4 monthly: { monthly: true }); like the flow defaults they only fill what the store doesn't hold. */
  function useGift(flow, over) {
    var st = React.useState(function () { return seed(flow, over); }), v = st[0], setV = st[1];
    var update = React.useCallback(function (patch) { setV(write(Object.assign(read(), patch))); }, []);
    return [v, update];
  }

  /* ---- numbers and labels (1 meal = $0.29; $106 = 365 meals, a daily meal for a child for a year) ---- */
  function meals(amount) { return Math.floor(amount / 0.29 + 1e-9); }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  /* $106 for whole dollars, $108.69 otherwise (buttons, short summaries, done answers). */
  function amt(n) { return Math.round(n * 100) % 100 === 0 ? '$' + Math.round(n).toLocaleString('en-US') : money(n); }
  function fee(amount) { return Math.round(amount * 269 / 106) / 100; } /* Figma: $2.69 on $106 */
  function eventOf(g) { return EVENTS.filter(function (e) { return e.id === g.eventId; })[0] || EVENTS[0]; }
  function goesTo(g) { return eventOf(g).short + '’s FMSC MobilePack™ event'; }
  function dedicated(g) { var d = g.dedInfo || DED; return (d.kind === 'memory' ? 'In memory of ' : 'In honor of ') + (d.name || '').trim(); }
  /* Done-step answer for "Your gift": "$106 monthly · 365 meals a month" / "$106 once · 365 meals". */
  function giftAnswer(g) {
    var m = meals(g.amount).toLocaleString('en-US');
    return g.freq === 'monthly' ? amt(g.amount) + ' monthly · ' + m + ' meals a month' : amt(g.amount) + ' once · ' + m + ' meals';
  }
  function monthlyNow(g) { return g.freq === 'monthly' || (g.event && g.monthly) || (g.flow === 'c' && g.monthly); }
  /* summary(g, opts): Gift summary props. opts: step (1–4), heading, totalLabel, eventSuffix. */
  function summary(g, o) {
    o = o || {};
    var step = o.step || 1;
    var monthly = step >= 4 ? monthlyNow(g) : g.freq === 'monthly';
    var withFee = step >= 3 && g.fee;
    var f = withFee ? fee(g.amount) : 0, total = g.amount + f;
    var m = meals(g.amount).toLocaleString('en-US');
    var rows = [['Gift', money(g.amount)], ['How often', monthly ? 'Monthly' : 'Once'], ['Meals provided', monthly ? m + '/month' : m]];
    if (g.event) rows.push(['Goes to', goesTo(g) + (o.eventSuffix || '')]);
    if (g.ded) rows.push(['Dedicated', dedicated(g)]);
    if (withFee) rows.push(['Processing fee', money(f)]);
    return {
      heading: o.heading || (step >= 4 ? 'Your gift' : 'Review your gift'),
      rows: rows,
      totalLabel: o.totalLabel || (monthly && step < 4 ? 'Total each month' : 'Total today'),
      totalValue: money(total),
      short: amt(total) + (monthly ? ' monthly · ' + m + ' meals a month' : ' once · ' + m + ' meals')
    };
  }

  /* ---- shared copy ---- */
  var FAQ = [
    { question: 'Is my gift tax deductible?', expanded: true, answer: 'Yes. Feed My Starving Children is a 501(c)(3) charitable nonprofit. The tax ID is 41-1601449, and donations are deductible to the full extent provided by law.' },
    { question: 'Whose name is my gift under?', answer: 'Yours, as you enter it above. If you’re giving for a company or organization, the gift and receipt carry its name.' },
    { question: 'Where do the meals go?', answer: 'FMSC donates the meals to food distribution partners, faith-based and humanitarian organizations that get them to children. FMSC meals have reached more than 100 countries, and more than 99% of meals safely reach their destination.' }
  ];
  var PEOPLE = {
    sarah: { first: 'Sarah', last: 'Whitfield', email: 'sarah.whitfield@gmail.com', street: '2280 Northdale Blvd. NW', city: 'Coon Rapids', state: 'MN', zip: '55433' },
    daniel: { first: 'Daniel', last: 'Okafor', email: 'daniel.okafor@gmail.com', street: '2410 Lyndale Ave. S.', city: 'Minneapolis', state: 'MN', zip: '55405' }
  };
  /* "Your details" done answer: one line + address on desktop, four lines on mobile (Figma). */
  /* What was typed on "Your details" (kept in the gift store as details_<who>), over the Figma sample person, so Change
     reopens the step with the user's entries and the done rows and confirmation repeat them (Jonny, Oct. 29, 2026). */
  function personOf(who) { return Object.assign({ apt: '', company: false, updates: false }, PEOPLE[who], read()['details_' + who] || {}); }
  function savePerson(who, patch) { var all = read(), key = 'details_' + who; all[key] = Object.assign({}, all[key] || {}, patch); write(all); }
  function detailsAnswer(who, mobile) {
    var p = personOf(who);
    var street = p.street + (p.apt ? ', ' + p.apt : '');
    return mobile
      ? p.first + ' ' + p.last + '\n' + p.email + '\n' + street + '\n' + p.city + ', ' + p.state + ' ' + p.zip
      : p.first + ' ' + p.last + ' · ' + p.email + '\n' + street + ', ' + p.city + ', ' + p.state + ' ' + p.zip;
  }
  var STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  /* ---- CSS ---- */
  var CSS = [
    '.gv-shell { padding: var(--section-y) var(--margin-x); }',
    /* Grid: head + main in the content column, the summary aside spanning both rows. */
    '.gv-shell__inner { width: 100%; max-width: var(--content-width); margin: 0 auto; container: gv-shell / inline-size; }',
    '.gv-grid { display: grid; grid-template-columns: minmax(0, 1fr) 384px; grid-template-areas: "head aside" "main aside"; grid-template-rows: auto 1fr; column-gap: var(--grid-gap); row-gap: var(--section-gap); align-items: start; }',
    '.gv-grid__head { grid-area: head; min-width: 0; display: flex; flex-direction: column; gap: var(--space-md); }',
    '.gv-grid__main { grid-area: main; min-width: 0; display: flex; flex-direction: column; gap: var(--section-gap); }',
    '.gv-grid__aside { grid-area: aside; min-width: 0; display: flex; flex-direction: column; gap: var(--grid-gap); }',
    '@container gv-shell (max-width: 999.98px) { .gv-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "aside" "main"; grid-template-rows: auto; } }',
    '@media (max-width: 599.98px) { .gv-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "aside" "main"; grid-template-rows: auto; row-gap: var(--section-gap); } .gv-grid--steps { grid-template-areas: "head" "main"; } }',
    '.gv-steps { display: flex; flex-direction: column; gap: var(--grid-gap); min-width: 0; }',
    '.gv-shell .fm-flow-step__answer { white-space: pre-line; }',
    '.gv-shell .fm-flow-step--done, .gv-shell .fm-flow-step--upcoming { box-shadow: none; }',

    /* Cards: surface, 1px subtle stroke, card-pad, radius-lg, shadow-md. */
    '.gv-card { box-sizing: border-box; display: flex; flex-direction: column; gap: var(--space-lg); min-width: 0; padding: var(--card-pad); background: var(--background-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); color: var(--content-primary); }',
    '.gv-card--tight { gap: var(--space-xs); }',
    '.gv-measure { max-width: 607px; }',
    '.gv-secondary { margin: 0; color: var(--content-secondary); }',

    /* Gift summary (Figma "Gift summary"): desktop card; mobile collapsed bar. */
    '.gv-summary { gap: var(--space-md); }',
    '.gv-summary__heading { margin: 0; color: var(--content-primary); }',
    '.gv-summary__rows { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0; }',
    '.gv-summary__row { display: flex; align-items: flex-start; gap: var(--space-md); }',
    '.gv-summary__row dt { flex: none; width: 140px; padding-top: var(--space-3xs); color: var(--content-secondary); }',
    '.gv-summary__row dd { flex: 1 1 0; min-width: 0; margin: 0; color: var(--content-primary); }',
    '.gv-summary__total { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm); color: var(--content-primary); }',
    '.gv-summary__total { margin: 0; }',
    '.gv-bar { display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-md); border-radius: var(--radius-md); background: var(--background-subtle); }',
    '.gv-bar__row { display: flex; align-items: center; gap: var(--space-sm); }',
    '.gv-bar__short { flex: 1 1 0; min-width: 0; margin: 0; color: var(--content-primary); }',
    '.gv-bar__toggle { flex: none; display: inline-flex; align-items: center; gap: var(--space-2xs); min-height: 44px; margin: calc(-1 * var(--space-sm)) 0; padding: 0; border: 0; background: transparent; color: var(--content-link); cursor: pointer; font-family: var(--font-sans); }',
    '.gv-aside-note { margin: 0; color: var(--content-secondary); }',

    /* Donate · Checkout (Figma "Donate / Context=Checkout"): the DS Donate module's frequency, readout and slider, without its box, tabs or button. */
    '.gv-shell .fm-donate.gv-donate { width: 100%; padding: 0; background: transparent; border: 0; border-radius: 0; }',
    '.gv-donate .fm-donate__answer { flex: 0 1 auto; }',
    '.gv-donate .fm-donate__input { flex: 0 0 171px; }',
    '.gv-donate.fm-donate--mobile .fm-donate__input { flex: none; }',
    '.gv-donate__line { margin: 0; color: var(--content-secondary); }',

    /* Gift options: 44px checkbox rows; open options indent space-xl. */
    '.gv-options { display: flex; flex-direction: column; gap: var(--space-sm); }',
    '.gv-options--closed { gap: 0; }',
    '.gv-option { display: flex; flex-direction: column; }',
    '.gv-check { display: flex; padding: var(--space-sm) 0; }',
    '.gv-check .fm-check { align-self: flex-start; }',
    '.gv-sub { display: flex; flex-direction: column; gap: var(--space-md); padding-left: var(--space-xl); }',
    '.gv-sub .gv-check { padding: var(--space-sm) 0; }',
    '.gv-radios { display: flex; flex-wrap: wrap; gap: var(--space-lg); margin: 0; padding: 0; border: 0; min-width: 0; }',
    '.gv-results { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0; padding: 0; border: 0; min-width: 0; }',
    '.gv-results .fm-radio { align-self: flex-start; }',
    '.gv-row { display: flex; gap: var(--space-md); min-width: 0; }',
    '.gv-row > * { flex: 1 1 0; min-width: 0; }',
    '.gv-row--city > :first-child { flex: 1 1 0; }',
    '.gv-row--city > :not(:first-child) { flex: 0 0 160px; }',
    '@media (max-width: 599.98px) { .gv-row--stack { flex-direction: column; } .gv-row--city > :not(:first-child) { flex: 1 1 0; } }',
    '.gv-fields { display: flex; flex-direction: column; gap: var(--space-md); min-width: 0; }',
    '.gv-fields .gv-check { padding: var(--space-sm) 0; }',

    /* Actions, divider, wallets */
    '.gv-actions { display: flex; align-items: center; }',
    '@media (max-width: 599.98px) { .gv-actions .fm-btn { width: 100%; } }',
    '.gv-wallets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-md); }',
    '@media (max-width: 599.98px) { .gv-wallets { grid-template-columns: repeat(2, minmax(0, 1fr)); } .gv-wallet--link { grid-column: 1 / -1; } }',
    '.gv-wallet { display: flex; align-items: center; justify-content: center; gap: var(--space-xs); min-height: 48px; padding: var(--space-10) var(--space-lg); border-radius: var(--radius-pill); background: var(--background-inverse); color: var(--content-inverse); text-decoration: none; white-space: nowrap; }',
    '@media (max-width: 599.98px) { .gv-wallet { padding: var(--space-10) var(--space-sm); } }',
    '.gv-wallet svg { flex: none; }',
    /* Link (Stripe) brand green: the Figma Wallet button fill is unbound (#00D66F); no DS token carries it. */
    '.gv-wallet--link { --gv-link-green: #00d66f; background: var(--gv-link-green); color: var(--content-primary); }',
    '.gv-wallet:hover { opacity: 0.9; }',

    /* Payment */
    '.gv-methods { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0; padding: 0; border: 0; min-width: 0; }',
    '.gv-method { display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-md); border-radius: var(--radius-md); background: var(--background-surface); box-shadow: inset 0 0 0 1px var(--border-subtle); }',
    '.gv-method--on { box-shadow: inset 0 0 0 2px var(--brand-primary); }',
    '.gv-method .fm-radio { align-self: flex-start; }',
    '.gv-pay { gap: var(--space-lg); }',
    '.gv-pay .gv-check { padding: var(--space-sm) 0; }',

    /* Details step: sign-in line + arrow link */
    '.gv-signin { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-xs); }',

    /* Confirmation */
    '.gv-impact { position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: var(--space-xs); box-sizing: border-box; min-height: 240px; padding: var(--card-pad); border-radius: var(--radius-lg); overflow: hidden; color: var(--content-on-brand);',
    '  background-image: linear-gradient(90deg, color-mix(in srgb, var(--gray-900) 40%, transparent) 0%, color-mix(in srgb, var(--gray-900) 30%, transparent) 55%, transparent 80%),',
    '    linear-gradient(180deg, color-mix(in srgb, var(--gray-900) 15%, transparent) 0%, color-mix(in srgb, var(--gray-900) 35%, transparent) 20%, color-mix(in srgb, var(--gray-900) 60%, transparent) 40%, color-mix(in srgb, var(--gray-900) 75%, transparent) 70%, color-mix(in srgb, var(--gray-900) 85%, transparent) 100%),',
    '    url("img/donate-table-builders.jpg"); background-size: cover; background-position: center; }',
    '@media (max-width: 599.98px) { .gv-impact { min-height: 260px; } }',
    '.gv-impact p { margin: 0; }',
    '.gv-impact .fm-arrow-link { align-self: flex-start; }',
    '.gv-confirm-title { display: flex; align-items: flex-start; gap: var(--space-md); }',
    '.gv-confirm-title__text { display: flex; flex-direction: column; gap: var(--space-xs); min-width: 0; }',
    '.gv-confirm-title__heading { margin: 0; color: var(--content-primary); }',
    '.gv-account { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-sm); }',
    '.gv-account__links { display: flex; flex-wrap: wrap; gap: var(--space-lg); }',
    '@media (max-width: 599.98px) { .gv-account__links { flex-direction: column; gap: var(--space-sm); } }',
    '.gv-create { display: flex; flex-direction: column; gap: var(--space-md); padding: var(--card-pad); border-radius: var(--radius-lg); background: var(--background-brand-subtle); }',
    '.gv-create__text { display: flex; flex-direction: column; gap: var(--space-xs); }',
    '.gv-create__text h3, .gv-create__text p { margin: 0; }',
    '.gv-create__password { display: flex; flex-direction: column; gap: var(--space-xs); }',
    '.gv-create__row { display: flex; align-items: flex-end; gap: var(--space-md); }',
    '.gv-create__row > .fm-field { flex: 1 1 0; min-width: 0; }',
    '.gv-create__row > .fm-btn { flex: none; }',
    '@media (max-width: 599.98px) { .gv-create__row { flex-direction: column; align-items: stretch; } }',
    /* Figma "Create a password" input shows no trailing action (Show trailing action = false): hide the DS reveal button. */
    '.gv-create .fm-field__action { display: none; }',
    '.gv-next { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-lg); }',
    '@media (max-width: 599.98px) { .gv-next { grid-template-columns: minmax(0, 1fr); } }',
    '.gv-next .gv-card, .gv-next-one { gap: var(--space-xs); }',
    '.gv-next h3, .gv-next-one h3 { margin: 0; color: var(--content-primary); }',
    '.gv-next .fm-arrow-link, .gv-next-one .fm-arrow-link { align-self: flex-start; }',

    /* FAQ: inside the content column on desktop (no section padding); full-width section on mobile. */
    '.gv-grid__main .fm-section-faq { padding: 0; align-items: flex-start; }',

    /* Sign in to give dialog (Figma "Dialog · Sign in to give — Sign in"), same build as the sign-up "Sign in to reserve" dialog. */
    'html.gv-lock { overflow: hidden; }',
    '.gv-layer { position: fixed; inset: 0; z-index: 100; display: flex; padding: var(--space-md) var(--margin-x); background: var(--scrim-strong); overflow-y: auto; overscroll-behavior: contain; }',
    '.gv-auth.fm-dialog { width: 528px; max-width: 100%; margin: auto; outline: none; }',
    '.gv-auth.fm-dialog.fm-mobile { width: 361px; }',
    '.gv-auth .fm-dialog__close { color: var(--graphic-ink); }',
    '.gv-auth__intro { color: var(--content-secondary); }',
    '.gv-auth__fields { display: flex; flex-direction: column; gap: var(--space-md); width: 100%; }',
    '.gv-auth__remember { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-sm); width: 100%; min-height: 44px; }',
    '.gv-auth__social { display: flex; gap: var(--space-sm); width: 100%; }',
    '.gv-auth__social > * { flex: 1 1 0; min-width: 0; }',
    '.gv-auth.fm-mobile .gv-auth__social { flex-direction: column; }',
    '.gv-auth.fm-mobile .gv-auth__social > * { flex: none; }',
    '.gv-auth.fm-mobile .gv-auth__submit { width: 100%; }',
    '.gv-auth__line { margin: 0; color: var(--content-secondary); }',
    '.gv-auth__link { color: var(--content-link); text-decoration: none; cursor: pointer; }',
    'button.gv-auth__link { padding: 0; margin: 0; border: 0; background: none; font: inherit; }',
    '.gv-auth__link:hover { text-decoration: underline; }',
    '.gv-auth__line .gv-auth__link, .gv-auth__remember > .gv-auth__link { position: relative; }',
    ".gv-auth__line .gv-auth__link::after, .gv-auth__remember > .gv-auth__link::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 44px; transform: translateY(-50%); }",
    /* DS fix (as on the sign-up and account pages): Footer Mobile keeps the desktop flex-basis on its stacked columns. */
    '@media (max-width: 599.98px) { .fm-footer--mobile .fm-footer__col, .fm-footer--mobile .fm-footer__brand { flex: none; min-width: 0; } }'
  ].join('\n');
  if (!document.getElementById('gv-shell-css')) {
    var st = document.createElement('style'); st.id = 'gv-shell-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---- blocks ---- */
  function cls(a, b) { return b ? a + ' ' + b : a; }
  function go(href) { if (isGive(href)) markNav(); window.location.href = href; }

  /* Header: DS Account page header, title only. */
  function Header() { return h(F.AccountPageHeader, { breakpoint: 'auto', title: 'Give meals', showBreadcrumb: false, showTag: false, showDescription: false, showStats: false, showAction: false }); }

  /* StepCard: the open step — FlowStep (Open) + body rows space-lg apart. */
  function StepCard(p) {
    return h('section', { className: cls('gv-card gv-step', p.className), 'aria-label': p.title },
      h(F.FlowStep, { breakpoint: 'auto', state: 'open', number: String(p.number), title: p.title }),
      p.children);
  }
  function DoneStep(p) {
    var mobile = F.useIsMobile();
    return h(F.FlowStep, { breakpoint: 'auto', state: 'done', number: String(p.number), title: p.title,
      answer: mobile && p.answerMobile ? p.answerMobile : p.answer, changeLabel: 'Change ' + p.title.toLowerCase(), onReopen: function () { go(p.href); } });
  }
  function UpcomingStep(p) { return h(F.FlowStep, { breakpoint: 'auto', state: 'upcoming', number: String(p.number), title: p.title }); }
  function Steps(p) { return h('div', { className: 'gv-steps' }, p.children); }

  /* GiftSummary: desktop card (heading, rows, rule, total). */
  function GiftSummary(p) {
    var s = p.summary;
    return h('section', { className: 'gv-card gv-summary', 'aria-labelledby': 'gv-summary-title' },
      h('h2', { className: 'gv-summary__heading heading-h4', id: 'gv-summary-title' }, s.heading),
      h(SummaryRows, { summary: s }));
  }
  function SummaryRows(p) {
    var s = p.summary;
    return h('div', { className: 'gv-summary__rows' },
      h('dl', { className: 'gv-summary__rows' },
        s.rows.map(function (r) {
          return h('div', { key: r[0], className: 'gv-summary__row' }, h('dt', { className: 'label-small' }, r[0]), h('dd', { className: 'body-base' }, r[1]));
        })),
      h(F.Divider, { showLabel: false }),
      h('p', { className: 'gv-summary__total label-large' }, h('span', null, s.totalLabel), h('span', null, s.totalValue)));
  }
  /* SummaryBar: mobile "Gift summary / Collapsed" — short summary + Show details (expands the rows). */
  function SummaryBar(p) {
    var s = p.summary;
    var o = React.useState(false), open = o[0], setOpen = o[1];
    return h('section', { className: 'gv-bar', 'aria-label': s.heading },
      h('div', { className: 'gv-bar__row' },
        h('p', { className: 'gv-bar__short body-small' }, s.short),
        h('button', { type: 'button', className: 'gv-bar__toggle label-small fm-focusable', 'aria-expanded': open, onClick: function () { setOpen(!open); } },
          open ? 'Hide details' : 'Show details', h(F.Icon, { name: open ? 'chevron-up' : 'chevron-down', size: 16 }))),
      open ? h(SummaryRows, { summary: s }) : null);
  }

  /* DonateCheckout: Figma "Donate / Context=Checkout" — frequency segments, amount readout + slider, monthly line.
     Built from the DS Donate module markup (fm-donate classes); controlled by the gift store. */
  var STOPS = [10, 50, 106, 424, 2255];
  function posFrom(d) { if (d <= STOPS[0]) return 0; for (var i = 0; i < 4; i++) if (d <= STOPS[i + 1]) return (i + (d - STOPS[i]) / (STOPS[i + 1] - STOPS[i])) * 100; return 400; }
  function dollarsFrom(p) { var i = Math.min(3, Math.floor(p / 100)), f = p / 100 - i; return Math.round(STOPS[i] + f * (STOPS[i + 1] - STOPS[i])); }
  /* Note line: Figma's lines at $106; the DS Donate module's dynamic note for other amounts. */
  function note(n, monthly) {
    if (n === 365) return monthly ? 'A year of daily meals for a child, every month' : 'A daily meal for a child for 12 months';
    if (n < 30) return 'A daily meal for a child for ' + n + (n === 1 ? ' day' : ' days');
    if (n <= 365) { var mo = Math.round(n / 30.42); return 'A daily meal for a child for ' + mo + (mo === 1 ? ' month' : ' months'); }
    var kids = Math.floor(n / 365), rest = n - kids * 365, s = 'A daily meal for ' + kids.toLocaleString('en-US') + (kids === 1 ? ' child' : ' children') + ' for a year';
    if (rest >= 30.42) { var rm = Math.round(rest / 30.42); s += ', plus ' + rm + (rm === 1 ? ' month' : ' months'); }
    return s;
  }
  var donateId = 0;
  function DonateCheckout(p) {
    var mobile = F.useIsMobile();
    var g = p.gift, set = p.onChange;
    var idRef = React.useRef(null); if (!idRef.current) idRef.current = 'gv-donate-' + (++donateId);
    var id = idRef.current;
    var d = React.useState(null), draft = d[0], setDraft = d[1];
    var n = meals(g.amount), monthly = g.freq === 'monthly';
    function seg(value, label, sub) {
      var on = g.freq === value;
      return h('label', { key: value, className: cls('fm-donate__seg', on ? 'fm-donate__seg--on' : '') },
        h('input', { type: 'radio', name: id + '-freq', value: value, checked: on, className: 'fm-visually-hidden',
          onChange: function () { set({ freq: value, monthly: value === 'monthly' }); } }),
        h('span', { className: 'fm-donate__seg-label label-base' }, label),
        h('span', { className: 'fm-donate__seg-sub caption' }, sub));
    }
    var h2 = mobile ? 'heading-h2-mobile' : 'heading-h2';
    var field = h('div', { key: 'f', className: 'fm-donate__input' },
      h('label', { htmlFor: id + '-amt', className: 'fm-donate__input-label label-small' }, "I'd like to give"),
      h('div', { className: 'fm-donate__field' },
        h(F.Icon, { name: 'currency-dollar', size: 20, className: 'fm-donate__field-icon' }),
        h('input', { id: id + '-amt', className: 'fm-donate__field-input ' + h2, inputMode: 'numeric', value: draft != null ? draft : String(g.amount), 'aria-describedby': id + '-result',
          onChange: function (e) { var raw = e.target.value.replace(/[^0-9]/g, ''); setDraft(raw); set({ amount: raw === '' ? 0 : parseInt(raw, 10) }); },
          onBlur: function () { setDraft(null); } })));
    var answer = h('div', { key: 'a', className: 'fm-donate__answer', id: id + '-result', 'aria-live': 'polite' },
      h('p', { className: 'fm-donate__result ' + h2 }, n.toLocaleString('en-US') + (n === 1 ? ' meal' : ' meals')),
      h('p', { className: 'fm-donate__note body-small' }, note(n, monthly)));
    var pos = posFrom(g.amount);
    return h('div', { className: cls('fm-donate gv-donate', mobile ? 'fm-mobile fm-donate--mobile' : '') },
      h('div', { className: 'fm-donate__freq', role: 'radiogroup', 'aria-label': 'Gift frequency' },
        seg('once', 'Give once', 'A single gift today'), seg('monthly', 'Give monthly', 'Join Table Builders')),
      h('div', { className: 'fm-donate__panel' },
        h('div', { className: 'fm-donate__readout' },
          h('div', { className: 'fm-donate__ask' }, mobile ? [answer, field] : [field, answer]),
          h('div', { className: 'fm-donate__slider' },
            h('div', { className: 'fm-donate__rail' },
              h('span', { className: 'fm-donate__track' }),
              h('span', { className: 'fm-donate__fill', style: { width: 'calc(14px + (100% - 28px) * ' + (pos / 400) + ')' } }),
              STOPS.map(function (s, i) { return h('span', { key: i, className: 'fm-donate__stop', style: { left: 'calc(14px + (100% - 28px) * ' + (i / 4) + ' - 3px)' } }); }),
              h('input', { type: 'range', min: 0, max: 400, step: 1, value: pos, className: 'fm-donate__range fm-focusable', 'aria-label': 'Gift amount',
                'aria-valuetext': '$' + g.amount.toLocaleString('en-US') + ', ' + n.toLocaleString('en-US') + ' meals',
                onChange: function (e) { setDraft(null); set({ amount: dollarsFrom(Number(e.target.value)) }); } })),
            h('div', { className: 'fm-donate__ticks caption', 'aria-hidden': 'true' },
              STOPS.map(function (s, i) {
                return h('span', { key: i, className: cls('fm-donate__tick', i === 4 ? 'fm-donate__tick--last' : ''), style: i === 4 ? undefined : { left: 'calc(14px + (100% - 28px) * ' + (i / 4) + ')' } }, '$' + s.toLocaleString('en-US'));
              }))))),
      monthly ? h('p', { className: 'gv-donate__line body-small' }, 'Your monthly gift makes you an FMSC Table Builder.') : null);
  }

  /* GiftOptions: Dedicate this gift · Give to an FMSC MobilePack™ event; each opens its fields (Figma B1). */
  function Check(p) {
    return h('div', { className: cls('gv-check', p.className) },
      h(F.Checkbox, { name: p.name, label: p.label, description: p.description, checked: !!p.checked, onChange: function (e) { p.onChange(e.target.checked); } }));
  }
  function GiftOptions(p) {
    var mobile = F.useIsMobile();
    var g = p.gift, set = p.onChange, ded = g.dedInfo || DED;
    function setDed(patch) { set({ dedInfo: Object.assign({}, ded, patch) }); }
    var q = (g.query || '').trim().toLowerCase();
    var results = EVENTS.filter(function (e) { return !q || e.label.toLowerCase().indexOf(q) >= 0; });
    return h('div', { className: cls('gv-options', g.ded || g.event ? '' : 'gv-options--closed') },
      h('div', { className: 'gv-option' },
        h(Check, { name: 'gv-ded', label: 'Dedicate this gift', checked: g.ded, onChange: function (v) { set({ ded: v }); } }),
        g.ded ? h('div', { className: 'gv-sub' },
          h('fieldset', { className: 'gv-radios' },
            h('legend', { className: 'fm-visually-hidden' }, 'Dedicate this gift'),
            h(F.Radio, { name: 'gv-ded-kind', value: 'honor', label: 'In honor of', checked: ded.kind !== 'memory', onChange: function () { setDed({ kind: 'honor' }); } }),
            h(F.Radio, { name: 'gv-ded-kind', value: 'memory', label: 'In memory of', checked: ded.kind === 'memory', onChange: function () { setDed({ kind: 'memory' }); } })),
          h('div', { className: 'gv-row gv-row--stack' },
            h(F.Input, { label: 'Their name', value: ded.name, onChange: function (e) { setDed({ name: e.target.value }); } }),
            h(F.Input, { label: 'Their email (optional)', type: 'email', value: ded.email, onChange: function (e) { setDed({ email: e.target.value }); } })),
          h(Check, { name: 'gv-ded-notify', label: 'Email them that you gave in their honor', checked: ded.notify, onChange: function (v) { setDed({ notify: v }); } })) : null),
      h('div', { className: 'gv-option' },
        /* Checking this keeps the Give once / Give monthly choice above (Jonny, Oct. 29, 2026). */
        h(Check, { name: 'gv-event', label: 'Give to an FMSC MobilePack™ event', checked: g.event, onChange: function (v) { set({ event: v }); } }),
        g.event ? h('div', { className: 'gv-sub' },
          h(F.Input, { label: 'Event name', icon: 'search', value: g.query, onChange: function (e) { set({ query: e.target.value }); } }),
          /* Blank search (A1, C1): no results and nothing picked until something is typed (Jonny, Oct. 29, 2026). */
          !q ? null : h('fieldset', { className: 'gv-results' },
            h('legend', { className: 'fm-visually-hidden' }, 'Events'),
            results.map(function (e) {
              return h(F.Radio, { key: e.id, name: 'gv-event-pick', value: e.id, label: e.label, description: e.description, checked: g.eventId === e.id, onChange: function () { set({ eventId: e.id }); } });
            }))) : null));
  }

  /* Primary (Large) button; full width on mobile. */
  function Continue(p) {
    return h('div', { className: 'gv-actions' },
      h(F.Button, { variant: p.variant || 'primary', size: 'large', href: p.href, onClick: p.onClick }, p.label));
  }

  /* Wallets: divider ("Or give with one tap" / "Or pay with") + Apple Pay, Google Pay, Link. Logos: Figma Brand & Payment icons. */
  var LOGOS = {
    apple: { t: 'translate(3 1)', d: 'M12.08 5L12.32 5.01C13.75 5.11 15.75 6.02 16.83 7.6C16.9 7.71 16.96 7.84 16.98 7.98C17.01 8.12 17.01 8.26 16.97 8.39C16.94 8.53 16.88 8.66 16.8 8.77C16.71 8.88 16.6 8.97 16.48 9.04C16.43 9.06 16.11 9.19 15.99 9.25C15.73 9.37 15.49 9.52 15.26 9.69C14.65 10.15 14.31 10.69 14.32 11.38C14.33 12.26 14.66 12.83 15.23 13.23C15.44 13.37 15.66 13.48 15.89 13.56C16.02 13.6 16.32 13.67 16.34 13.68C16.53 13.75 16.7 13.87 16.82 14.04C16.94 14.21 17 14.41 17 14.62C17 17.24 13.96 21 11.71 21C10.92 21 10.44 20.91 9.73 20.68L9.63 20.65C9.17 20.51 8.93 20.46 8.5 20.46C7.98 20.46 7.64 20.52 6.98 20.7L6.78 20.75C6.21 20.91 5.82 20.98 5.28 21C2.54 21 0 15.91 0 11.93C0 8.06 1.79 5.01 5.29 5.01C5.58 5.01 5.88 5.05 6.19 5.14C6.6 5.24 6.97 5.4 7.49 5.64C8.28 6.02 8.44 6.08 8.5 6.08L8.52 6.08C8.55 6.08 8.64 6.04 9.57 5.63C10.63 5.16 11.44 4.94 12.32 5.01L12.08 5ZM11 0C11.27 0 11.52 0.11 11.71 0.29C11.89 0.48 12 0.73 12 1C12 1.8 11.68 2.56 11.12 3.12C10.56 3.68 9.8 4 9 4C8.73 4 8.48 3.89 8.29 3.71C8.11 3.52 8 3.27 8 3C8 2.2 8.32 1.44 8.88 0.88C9.44 0.32 10.2 0 11 0Z' },
    google: { t: 'translate(2 2)', d: 'M10 0C12.29 0 14.51 0.78 16.29 2.23C16.4 2.32 16.49 2.43 16.56 2.56C16.62 2.69 16.66 2.83 16.66 2.98C16.66 3.12 16.64 3.26 16.58 3.4C16.52 3.53 16.44 3.65 16.33 3.75L14.82 5.11C14.65 5.26 14.43 5.35 14.2 5.36C13.97 5.37 13.74 5.31 13.56 5.17C12.54 4.42 11.31 4.01 10.05 4C8.79 3.99 7.56 4.38 6.53 5.11C5.5 5.84 4.73 6.88 4.32 8.07C3.91 9.27 3.9 10.56 4.27 11.77C4.64 12.97 5.38 14.03 6.39 14.79C7.39 15.55 8.62 15.98 9.88 16C11.14 16.03 12.38 15.66 13.41 14.94C14.45 14.22 15.24 13.19 15.66 12L12 12C11.75 12 11.52 11.91 11.34 11.75C11.15 11.58 11.04 11.36 11.01 11.12L11 11L11 9C11 8.73 11.11 8.48 11.29 8.29C11.48 8.11 11.73 8 12 8L18.94 8C19.19 8 19.43 8.09 19.61 8.26C19.8 8.42 19.91 8.65 19.94 8.89C19.98 9.26 20 9.63 20 10C20 15.52 15.52 20 10 20C4.48 20 0 15.52 0 10C0 4.48 4.48 0 10 0Z' },
    link: { t: 'translate(5 2)', d: 'M7.5 0C9.95 0 12.04 0.44 13.43 1.1C13.62 1.19 13.78 1.33 13.88 1.52C13.98 1.7 14.02 1.92 13.99 2.12L13.49 6.12C13.47 6.28 13.42 6.43 13.33 6.56C13.24 6.7 13.12 6.8 12.98 6.88C12.84 6.96 12.68 7 12.52 7C12.36 7 12.21 6.97 12.06 6.9C11.02 6.39 9.45 6.08 7.9 6.08C7.76 6.08 7.65 6.09 7.56 6.1L7.59 6.13L7.66 6.17C7.98 6.38 8.49 6.61 9.33 6.92C13.16 8.27 15 10.16 15 13.5C15 15.63 14.24 17.23 12.7 18.42C11.41 19.45 9.28 20 7 20C4.6 20 2.28 19.36 0.51 18.37C0.34 18.28 0.2 18.13 0.11 17.95C0.02 17.77 -0.02 17.57 0.01 17.38L0.51 13.38C0.53 13.21 0.59 13.06 0.68 12.92C0.78 12.79 0.91 12.68 1.06 12.6C1.2 12.53 1.37 12.5 1.53 12.5C1.7 12.51 1.86 12.55 2 12.64C3.29 13.39 5.64 14 7 14C7.39 14 7.7 13.85 7.87 13.7L7.9 13.67L7.81 13.64C7.65 13.58 6.23 13.14 5.66 12.94C2.04 11.64 0 9.33 0 6C0 4.11 0.88 2.44 2.37 1.22C3.59 0.24 4.89 0 7.5 0Z' }
  };
  function Wallets(p) {
    function btn(k, label) {
      var l = LOGOS[k];
      return h('a', { key: k, className: cls('gv-wallet fm-focusable', 'gv-wallet--' + k), href: p.href },
        h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, h('path', { d: l.d, transform: l.t, fill: 'currentColor' })),
        h('span', { className: 'label-large' }, label));
    }
    return h(Fragment, null,
      h(F.Divider, { label: p.label }),
      h('div', { className: 'gv-wallets' }, btn('apple', 'Apple Pay'), btn('google', 'Google Pay'), btn('link', 'Link')));
  }

  /* Details: Figma "Step 2 · Your details" fields. who: 'sarah' | 'daniel'; signIn: the line + arrow link above the fields. */
  function Details(p) {
    var mobile = F.useIsMobile();
    var st = React.useState(function () { return personOf(p.who); }), who = st[0], setWho = st[1];
    function upd(patch) { savePerson(p.who, patch); setWho(Object.assign({}, who, patch)); }
    function field(key, props) { return Object.assign({ key: key, value: who[key] || '', onChange: function (e) { var o = {}; o[key] = e.target.value; upd(o); } }, props); }
    function chk(key, name, label) {
      return h(Check, { key: name, name: name, label: label, checked: !!who[key], onChange: function (v) { var o = {}; o[key] = v; upd(o); } });
    }
    var stateField = h(F.Dropdown, { key: 'st', label: 'State', showLabel: true, options: STATES, value: who.state, onChange: function (v) { upd({ state: v }); } });
    var zip = h(F.Input, field('zip', { label: 'ZIP code', autoComplete: 'postal-code' }));
    var city = h(F.Input, field('city', { label: 'City', autoComplete: 'address-level2' }));
    return h(Fragment, null,
      h('div', { className: 'gv-signin' },
        h('p', { className: 'gv-secondary body-base' }, p.signInLine),
        h(F.ArrowLink, { href: p.signInHref, label: p.signInLabel, onClick: p.onSignInClick })),
      h('div', { className: 'gv-fields' },
        h('div', { className: 'gv-row gv-row--stack' },
          h(F.Input, field('first', { label: 'First name', autoComplete: 'given-name' })),
          h(F.Input, field('last', { label: 'Last name', autoComplete: 'family-name' }))),
        h(F.Input, field('email', { label: 'Email', type: 'email', description: "We'll send your receipt here.", autoComplete: 'email' })),
        chk('company', 'gv-company', 'Give as a company or organization'),
        h(F.Input, field('street', { label: 'Street address', autoComplete: 'address-line1' })),
        h(F.Input, field('apt', { label: 'Apt., suite or floor (optional)', autoComplete: 'address-line2' })),
        mobile ? h(Fragment, null, city, h('div', { className: 'gv-row' }, stateField, zip))
          : h('div', { className: 'gv-row gv-row--city' }, city, stateField, zip),
        p.updates ? chk('updates', 'gv-updates', 'Send me email updates from FMSC') : null));
  }

  /* Payment: fee checkbox, Card / Bank account options, processor line, monthly note or "Make this a monthly gift",
     the Give button and the wallets. onGive(href) routes; giveHref(g) picks the confirmation. */
  function Payment(p) {
    var g = p.gift, set = p.onChange;
    var f = fee(g.amount), total = g.amount + (g.fee ? f : 0);
    var monthlyGift = g.freq === 'monthly';
    var label = 'Give ' + amt(total) + (monthlyGift || g.monthly ? ' monthly' : '');
    var card = g.method !== 'bank';
    return h(Fragment, null,
      h(Check, { name: 'gv-fee', label: 'Add ' + money(f) + ' to cover the processing fee', description: 'It covers what FMSC pays to process your gift.', checked: g.fee, onChange: function (v) { set({ fee: v }); } }),
      h('fieldset', { className: 'gv-methods' },
        h('legend', { className: 'fm-visually-hidden' }, 'Payment method'),
        h('div', { className: cls('gv-method', card ? 'gv-method--on' : '') },
          h(F.Radio, { name: 'gv-method', value: 'card', label: 'Card', checked: card, onChange: function () { set({ method: 'card' }); } }),
          card ? h('div', { className: 'gv-fields' },
            h(F.Input, { label: 'Card number', placeholder: '1234 1234 1234 1234', autoComplete: 'cc-number' }),
            h('div', { className: 'gv-row' },
              h(F.Input, { label: 'Expiration (MM/YY)', placeholder: 'MM/YY', autoComplete: 'cc-exp' }),
              h(F.Input, { label: 'Security code', placeholder: 'CVC', autoComplete: 'cc-csc' })),
            h(F.Input, { label: 'ZIP code', placeholder: '55433', autoComplete: 'postal-code' })) : null),
        h('div', { className: cls('gv-method', !card ? 'gv-method--on' : '') },
          h(F.Radio, { name: 'gv-method', value: 'bank', label: 'Bank account', checked: !card, onChange: function () { set({ method: 'bank' }); } }),
          !card ? h('p', { className: 'gv-secondary body-small' }, 'You’ll sign in to your bank to connect the account.') : null)),
      h('p', { className: 'gv-secondary caption' }, 'Payments are processed securely by Stripe.'),
      /* Event gifts (B3) always show "Make this a monthly gift", checked when Give monthly was picked on step 1 and
         unchecked for Give once; ticking it switches the gift's frequency (Jonny, Oct. 29, 2026). */
      g.event
        ? h(Check, { name: 'gv-monthly', label: 'Make this a monthly gift', checked: monthlyGift, onChange: function (v) { set({ freq: v ? 'monthly' : 'once', monthly: v }); },
            description: 'Your first gift goes to ' + goesTo(g) + '. Later gifts go to FMSC.' })
        : monthlyGift
        ? h('p', { className: 'gv-secondary body-small' }, 'Charged today, then monthly on the same date. You can change or stop your monthly gift anytime.')
        : h(Check, { name: 'gv-monthly', label: 'Make this a monthly gift', checked: g.monthly, onChange: function (v) { set({ monthly: v }); },
            description: 'Give this amount each month instead. You can change or stop it anytime.' }),
      h(Continue, { variant: 'gold', label: label, href: p.giveHref }),
      h(Wallets, { label: 'Or pay with', href: p.giveHref }));
  }

  /* ---- confirmation blocks ---- */
  function Impact(p) {
    var mobile = F.useIsMobile();
    return h('section', { className: 'gv-impact', 'aria-label': p.eyebrow },
      h('p', { className: 'overline' }, p.eyebrow),
      h('p', { className: mobile ? 'heading-h3-mobile' : 'heading-h3' }, p.headline),
      h('p', { className: 'body-small' }, 'More than 99% of meals safely reach their destination.'),
      p.link ? h(F.ArrowLink, { tone: 'on-dark', href: 'impact.html', label: 'See where meals go' }) : null);
  }
  function Confirmation(p) {
    var mobile = F.useIsMobile();
    return h('section', { className: 'gv-card gv-confirm', 'aria-labelledby': 'gv-confirm-title' },
      h('div', { className: 'gv-confirm-title' },
        h(F.IconBadge, { color: 'success', size: mobile ? 'medium' : 'large', icon: 'check' }),
        h('div', { className: 'gv-confirm-title__text' },
          h('h2', { className: 'gv-confirm-title__heading ' + (mobile ? 'heading-h3-mobile' : 'heading-h3'), id: 'gv-confirm-title' }, p.title),
          h('p', { className: 'gv-secondary gv-measure body-base' }, p.body))),
      p.children);
  }
  function AccountBlock(p) {
    return h('div', { className: 'gv-account' },
      h('p', { className: 'gv-secondary gv-measure body-base' }, p.line),
      h('div', { className: 'gv-account__links' },
        p.links.map(function (l) { return h(F.ArrowLink, { key: l.label, href: l.href, label: l.label }); })));
  }
  function CreateAccount(p) {
    var mobile = F.useIsMobile();
    var input = h(F.Input, { label: 'Create a password', type: 'password', autoComplete: 'new-password', description: mobile ? 'Use at least 8 characters, with a capital letter, a number and a special character.' : undefined });
    var btn = h(F.Button, { variant: 'primary', size: 'large', href: 'create-account.html', fullWidth: mobile }, 'Create an account');
    return h('section', { className: 'gv-create', 'aria-labelledby': 'gv-create-title' },
      h('div', { className: 'gv-create__text' },
        h('h3', { className: mobile ? 'heading-h4-mobile' : 'heading-h4', id: 'gv-create-title' }, 'Save this gift to an FMSC account'),
        h('p', { className: 'gv-secondary body-base' }, 'Keep your receipts and giving history in one place, and give next time without retyping your details. Your account uses ' + p.email + '.')),
      mobile ? h(Fragment, null, input, btn)
        : h('div', { className: 'gv-create__password' },
          h('div', { className: 'gv-create__row' }, input, btn),
          h('p', { className: 'gv-secondary body-small' }, 'Use at least 8 characters, with a capital letter, a number and a special character.')));
  }
  function NextCard(p) {
    var mobile = F.useIsMobile();
    return h('section', { className: cls('gv-card', p.className), 'aria-label': p.title },
      h('h3', { className: mobile ? 'heading-h4-mobile' : 'heading-h4' }, p.title),
      h('p', { className: 'gv-secondary body-base' }, p.body),
      p.link);
  }
  var SHOP = { title: 'Shop FMSC MarketPlace™', body: 'Artisan-crafted goods made by people in the communities FMSC serves.' };
  function shopLink() { return h(F.ArrowLink, { type: 'external', href: 'marketplace.html', label: 'Visit the shop' }); }
  /* NextSteps: "Become a Table Builder" + MarketPlace cards (tableBuilder: B4, C4) or the MarketPlace card alone (A4, B4 monthly). */
  function NextSteps(p) {
    if (!p.tableBuilder) return h(NextCard, { title: SHOP.title, body: SHOP.body, link: shopLink(), className: 'gv-next-one' });
    return h('div', { className: 'gv-next' },
      h(NextCard, { title: 'Become a Table Builder', body: 'Choose any amount to give each month. Every 29 cents provides a meal, and you can change or stop your gift anytime.',
        link: h(F.ArrowLink, { href: 'give-a1.html', label: 'Give monthly' }) }),
      h(NextCard, { title: SHOP.title, body: SHOP.body, link: shopLink() }));
  }

  /* ---- GiveShell ---- */
  var img = function (n) { return 'img/' + n; };
  function GiveShell(props) {
    var mobile = F.useIsMobile();
    var s = props.summary;
    var confirm = !!props.confirm;
    var aside = mobile
      ? (confirm ? h(SummaryBar, { summary: s }) : null)
      : h(Fragment, null, h(GiftSummary, { summary: s }), props.asideNote ? h('p', { className: 'gv-aside-note body-small' }, props.asideNote) : null);
    var faq = props.faq ? h(F.SectionFAQ, { breakpoint: 'auto', header: { align: 'left', heading: 'Before you give', showEyebrow: false, showSupporting: false },
      items: FAQ, showLink: true, linkLabel: 'See all FMSC FAQs', linkHref: '#' }) : null;
    return h(Fragment, null,
      h(window.SiteNav, { current: 'donate' }),
      h('main', { id: 'main' },
        h('div', { className: 'gv-shell' },
          h('div', { className: 'gv-shell__inner' },
            h('div', { className: cls('gv-grid', confirm ? '' : 'gv-grid--steps') },
              h('div', { className: 'gv-grid__head' }, props.head || h(Header), !confirm && mobile ? h(SummaryBar, { summary: s }) : null),
              aside ? h('aside', { className: 'gv-grid__aside', 'aria-label': 'Gift summary' }, aside) : null,
              h('div', { className: 'gv-grid__main' }, props.children, mobile ? null : faq)))),
        mobile ? faq : null),
      h(F.Footer, {
        breakpoint: 'auto',
        logoSrc: img('fmsc-logo-text-only.png'),
        /* Give frames' footer copy ("Finances", "Host a MobilePack™ event"), as on the sign-up flow; site links wired. */
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

  /* Routing (Figma prototype reactions). Signed-in confirmation: event gift → b4 (b4-monthly when made monthly), else a4. */
  function confirmHref(g) {
    if (g.flow === 'c') return 'give-c4.html';
    if (g.event) return g.monthly || g.freq === 'monthly' ? 'give-b4-monthly.html' : 'give-b4.html';
    return 'give-a4.html';
  }
  function paymentHref(g) { return g.event ? 'give-b3.html' : 'give-a3.html'; }
  function giftHref(g) { return g.event ? 'give-b1.html' : 'give-a1.html'; }

  GiveShell.useGift = useGift;
  GiveShell.store = { get: read, set: function (p) { return write(Object.assign(read(), p)); } };
  GiveShell.summary = summary;
  GiveShell.giftAnswer = giftAnswer;
  GiveShell.detailsAnswer = detailsAnswer;
  GiveShell.person = personOf;
  GiveShell.markNav = markNav;
  GiveShell.confirmHref = confirmHref;
  GiveShell.paymentHref = paymentHref;
  GiveShell.giftHref = giftHref;
  GiveShell.fmt = { meals: meals, money: money, amt: amt, fee: fee, goesTo: goesTo, dedicated: dedicated, monthlyNow: monthlyNow };
  GiveShell.people = PEOPLE;
  window.GiveShell = GiveShell;
  /* ---- Sign in to give (Figma "Dialog · Sign in to give — Sign in", Oct. 29, 2026) ----
     C2 "Sign in →" opens it. Sign in and continue, Google and Facebook sign in (FMSCAuth.signIn()) and go to payment
     (Figma "C3 Payment · Signed in": give-c3.html, now signed in). "Keep giving as a guest", Close, Escape and the scrim
     close it; focus returns to the link. Fields start empty and nothing is validated. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var GOOGLE_MARK = h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
    h('path', { d: 'M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945z', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
  function SignInToGive(p) {
    var mobile = F.useIsMobile();
    var ref = React.useRef(null), closeRef = React.useRef(p.onClose);
    closeRef.current = p.onClose;
    React.useLayoutEffect(function () {
      var el = ref.current, root = document.getElementById('root');
      root.inert = true; document.documentElement.classList.add('gv-lock');
      var d = el.querySelector('[role="dialog"]'); if (d) { d.setAttribute('tabindex', '-1'); d.focus(); }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
        if (e.key !== 'Tab') return;
        var list = Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null; });
        if (!list.length) return;
        var a = list[0], b = list[list.length - 1];
        if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement) || document.activeElement.getAttribute('role') === 'dialog')) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && (document.activeElement === b || !el.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
      }
      document.addEventListener('keydown', onKey);
      return function () {
        document.removeEventListener('keydown', onKey);
        root.inert = false; document.documentElement.classList.remove('gv-lock');
        if (p.returnFocus) p.returnFocus();
      };
    }, []);
    function go(e) { if (e) e.preventDefault(); window.FMSCAuth.signIn(); markNav(); window.location.href = p.next || 'give-c3.html'; }
    function inert(e) { e.preventDefault(); }
    var body = h('form', { className: 'gv-auth__fields', noValidate: true, onSubmit: go },
      h('p', { className: 'gv-auth__intro body-small' }, 'We’ll fill in your details and add this gift to your giving history. Your gift stays the same.'),
      h('div', { className: 'gv-auth__fields' },
        h(F.Input, { id: 'gv-si-email', name: 'email', label: 'Email', type: 'email', autoComplete: 'email' }),
        h(F.Input, { id: 'gv-si-password', name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' })),
      h('div', { className: 'gv-auth__remember' },
        h(F.Checkbox, { name: 'remember', label: 'Keep me signed in' }),
        h('a', { className: 'gv-auth__link body-small', href: '#', onClick: inert }, 'Forgot password?')),
      h('div', null, h(F.Button, { variant: 'primary', size: 'large', type: 'submit', className: 'gv-auth__submit', fullWidth: mobile }, 'Sign in and continue')),
      h(F.Divider, { label: 'or' }),
      h('div', { className: 'gv-auth__social' },
        h(F.SocialSignInButton, { provider: 'google', mark: GOOGLE_MARK, fullWidth: true, label: mobile ? 'Continue with Google' : 'Google', onClick: go }),
        h(F.SocialSignInButton, { provider: 'facebook', fullWidth: true, label: mobile ? 'Continue with Facebook' : 'Facebook', onClick: go })),
      h('p', { className: 'gv-auth__line body-small' }, 'No account? ',
        h('button', { type: 'button', className: 'gv-auth__link fm-focusable', onClick: function () { closeRef.current(); } }, 'Keep giving as a guest'),
        '. You can create one after your gift.'));
    return ReactDOM.createPortal(
      h('div', { ref: ref, className: 'gv-layer', onMouseDown: function (e) { if (e.target === e.currentTarget) closeRef.current(); } },
        h(F.Dialog, { breakpoint: mobile ? 'mobile' : 'desktop', modal: true, className: 'gv-auth', actions: null, closeLabel: 'Close',
          title: 'Sign in to save this gift to your account', onClose: function () { closeRef.current(); } }, body)),
      document.body);
  }

  window.GiveUI = {
    SignInToGive: SignInToGive,
    Header: Header, StepCard: StepCard, DoneStep: DoneStep, UpcomingStep: UpcomingStep, Steps: Steps,
    GiftSummary: GiftSummary, SummaryBar: SummaryBar, DonateCheckout: DonateCheckout, GiftOptions: GiftOptions, Check: Check,
    Continue: Continue, Wallets: Wallets, Details: Details, Payment: Payment,
    Impact: Impact, Confirmation: Confirmation, AccountBlock: AccountBlock, CreateAccount: CreateAccount, NextSteps: NextSteps
  };
})();
