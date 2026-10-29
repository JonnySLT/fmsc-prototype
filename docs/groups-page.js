/* Groups audience pages (Churches, Schools, Workplaces, Families) — shared layout.
   Figma: Desktop|Mobile/How to Help/Groups — Churches | Schools | Workplaces | Families
   (Client Prototype file, "Usability test" pages; same frames on the redesign file's Designs page).
   Each groups-*.html holds only its copy and images and calls window.renderGroupsPage(data).
   Page styles live here so the four pages stay identical; every value is an FMSC DS token. */
(function () {
  'use strict';

  var CSS = [
    'html, body { margin: 0; background: var(--background-canvas); color: var(--content-primary); }',
    'body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }',
    '* { box-sizing: border-box; }',
    'img { display: block; max-width: 100%; }',
    'h1, h2, h3, h4, p, ul, ol { margin: 0; }',

    /* Hero: Workplaces desktop crops the photo to its lower band (Figma image crop, top at 33%). */
    '.gp-page--workplaces .fm-hero:not(.fm-hero--mobile) .fm-hero__img { object-position: 50% 66%; }',

    /* Card grid sections (Why, More ways) sit on background/subtle. */
    '.gp-grid { background: var(--background-subtle); }',
    '.gp-why .fm-feature-card { width: 100%; height: 100%; }',
    '.gp-more .fm-section-card-grid__card { height: 100%; }',

    /* Scripture band: Figma has no photo, only the quote band’s grey fill (#80878f) under the 55% scrim, plus a
       white cross at 10% opacity. #80878f is the component’s raw, unbound fill (no DS token matches; host-mobilepack.html
       keeps the same value). The cross is decorative art, sized and placed as in the frame. */
    '.gp-quote .fm-quote-band__img--empty { background: #80878f; }',
    '.gp-quote .fm-quote-band__img--empty .fm-icon, .gp-quote .fm-quote-band__img--empty svg { display: none; }',
    '.gp-quote .fm-quote-band__quote { z-index: 1; }',
    '.gp-quote::after { content: ""; position: absolute; top: -51.5px; right: 65px; width: 221px; height: 309px; background: url(img/groups-cross.svg) center / contain no-repeat; opacity: 0.1; pointer-events: none; }',
    '.gp-quote.fm-quote-band--mobile::after { top: 58px; right: -58px; width: 152px; height: 213px; }',

    /* Book your … in three steps */
    '.gp-section { display: flex; flex-direction: column; align-items: center; padding: var(--section-y) var(--margin-x); background: var(--background-canvas); }',
    '.gp-inner { width: 100%; max-width: var(--content-width); display: flex; flex-direction: column; align-items: flex-start; gap: var(--section-gap); }',
    '.gp-inner > * { width: 100%; }',
    '.gp-header .fm-section-header__supporting { max-width: 730px; }',
    '.gp-steps-panel { container-type: inline-size; padding: var(--space-xl) var(--card-pad); background: var(--background-brand-subtle); border-radius: var(--radius-lg); }',
    '.gp-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--grid-gap); }',
    '.gp-steps .fm-step-item { width: 100%; }',
    /* Three steps or one column — never a 2 + 1 row with step 3 stranded. */
    '@container (max-width: 720px) { .gp-steps { grid-template-columns: minmax(0, 1fr); gap: var(--space-md); } }',
    '.gp-facts { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-md) var(--space-lg); color: var(--content-secondary); }',
    '.gp-facts.gp-facts { width: auto; }',
    '.gp-fact { display: flex; align-items: center; gap: var(--space-xs); }',
    '.gp-fact .fm-icon { flex: none; color: var(--content-secondary); }',
    '.gp-account { color: var(--content-secondary); max-width: 607px; }',

    /* Finder card: title, then City or ZIP code | Date | How many are coming? | Find a packing time on one row. */
    '.gp-finder { container-type: inline-size; display: flex; flex-direction: column; gap: var(--space-md); padding: var(--card-pad); background: var(--background-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }',
    '.gp-finder__title { color: var(--content-primary); }',
    '.gp-finder__fields { display: flex; align-items: flex-end; gap: var(--grid-gap); }',
    '.gp-finder__search { flex: 1 1 auto; min-width: 0; }',
    '.gp-finder__select { flex: 0 0 160px; min-width: 0; }',
    '.gp-finder__submit { flex: none; }',
    /* No in-between Figma layout: when the row can’t keep the search field usable, give it its own line. */
    '@container (max-width: 860px) {',
    '  .gp-finder__fields { flex-wrap: wrap; }',
    '  .gp-finder__search { flex: 1 1 100%; }',
    '  .gp-finder__select { flex: 1 1 160px; }',
    '}',

    /* Employer matching band (navy) — same module as donate.html#matching. */
    '.gp-match { display: flex; justify-content: center; padding: var(--space-xl) var(--margin-x); background: var(--background-brand-dark); color: var(--content-inverse); }',
    '.gp-match__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--grid-gap); width: 100%; max-width: var(--content-width); }',
    '.gp-match__copy { display: flex; flex-direction: column; gap: var(--space-md); flex: 1 1 400px; max-width: 619px; }',
    '.gp-match__copy p { max-width: 607px; }',
    '.gp-match__actions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-md); flex: 0 1 435px; min-width: 0; }',
    '.gp-match__actions .fm-search { width: 100%; }',
    '.gp-match__credit { display: flex; align-items: center; gap: var(--space-2xs); }',
    '.gp-match__credit img { width: 24px; height: 25px; flex: none; }',

    /* FAQ: Figma answers are a 607px text box; each item’s 1px top rule sits in its height (97px closed). */
    '.gp-faq .fm-section-faq__answer { max-width: 607px; white-space: pre-line; }',
    '.gp-faq .fm-section-faq__item { box-shadow: none; border-top: 1px solid var(--border-subtle); }',

    /* CTA band: Figma hides the eyebrow; subtext is content/on-brand (white). */
    '.gp-cta .fm-cta-band__eyebrow:empty { display: none; }',
    '.gp-cta .fm-cta-band__subtext { color: var(--content-on-brand); }',
    '.fm-footer--desktop .fm-footer__legal-copy { max-width: 968px; }',

    /* Mobile frame (393): below 600px */
    '@media (max-width: 599.98px) {',
    '  .gp-steps-panel { padding: var(--card-pad); }',
    '  .gp-steps { gap: var(--space-md); }',
    '  .gp-facts { flex-direction: column; align-items: stretch; gap: var(--space-md); }',
    '  .gp-facts.gp-facts { width: 100%; }',
    '  .gp-account { max-width: none; }',
    '  .gp-finder__fields { flex-direction: column; align-items: stretch; gap: var(--space-md); }',
    '  .gp-finder__search, .gp-finder__select, .gp-finder__submit { flex: none; }',
    '  .gp-match__row { flex-direction: column; align-items: stretch; gap: var(--grid-gap); }',
    '  .gp-match__copy { flex: none; max-width: none; }',
    '  .gp-match__actions { flex: none; align-items: flex-start; }',
    '  .gp-match__credit img { width: 40px; height: 41px; }',
    '  .gp-faq .fm-section-faq__answer { max-width: none; }',
    /* DS fix: Footer Mobile keeps the desktop flex-basis (140px) on its stacked columns, which becomes height. */
    '  .fm-footer--mobile .fm-footer__col, .fm-footer--mobile .fm-footer__brand { flex: none; min-width: 0; }',
    '}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('gp-styles')) return;
    var el = document.createElement('style');
    el.id = 'gp-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* Shared Figma copy (identical on all four frames). */
  var FACTS = [
    ['users-group', 'No minimum or maximum group size'],
    ['clock', 'Two hours, orientation included'],
    ['map-pin', 'Eight packing sites in Minnesota, Illinois, Arizona and Texas']
  ];
  var ACCOUNT_LINE = 'Whoever books needs an FMSC account. It keeps your reservation and everyone’s volunteer hours in one place.';

  /* Finder options: Figma shows the closed fields only (placeholders "Any date" and "Group size").
     Date options match the homepage/volunteer finder; volunteer.html reads ?where=&when= from here. */
  var DATE_OPTIONS = ['This week', 'This month', 'Next month'];
  var SIZE_OPTIONS = ['1–10', '11–25', '26–50', '51–100', 'More than 100'];

  function renderGroupsPage(d) {
    injectCSS();
    var F = window.FMSC, h = React.createElement, Fragment = React.Fragment;
    var img = function (n) { return 'img/' + n; };

    function Header(p) {
      return h(F.SectionHeader, { breakpoint: 'auto', className: 'gp-header', align: 'left', showEyebrow: false, showSupporting: !!p.supporting,
        heading: h('span', { id: p.id }, p.heading), supporting: p.supporting, headingLevel: p.level });
    }

    /* DS StepItem has no Mobile variant: below 600px render the same markup with the mobile H4 (18/24) title. */
    function Step(p) {
      var mobile = F.useIsMobile();
      if (!mobile) return h(F.StepItem, { as: 'li', indicator: 'number', number: p.number, title: p.title, description: p.description, titleAs: 'h3' });
      return h('li', { className: 'fm-step-item fm-step-item--number' },
        h('span', { className: 'fm-step-item__number body-large-mobile', 'aria-hidden': 'true' }, p.number),
        h('div', { className: 'fm-step-item__copy' },
          h('h3', { className: 'fm-step-item__title heading-h4-mobile' }, h('span', { className: 'fm-visually-hidden' }, 'Step ' + p.number + ': '), p.title),
          h('p', { className: 'fm-step-item__desc body-base' }, p.description)));
    }

    /* DS FeatureCard titles are always Heading/H3 (24/32); the mobile frame uses the mobile H3 (22/28). */
    function useMobileCardTitles(mobile) {
      React.useLayoutEffect(function () {
        document.querySelectorAll('.gp-why .fm-feature-card__title').forEach(function (el) {
          el.classList.toggle('heading-h3-mobile', mobile); el.classList.toggle('heading-h3', !mobile);
        });
      }, [mobile]);
    }

    function Finder() {
      var mobile = F.useIsMobile();
      var _q = React.useState(''), q = _q[0], setQ = _q[1];
      var _d = React.useState(null), date = _d[0], setDate = _d[1];
      var _s = React.useState(null), size = _s[0], setSize = _s[1];
      function submit(e) {
        e.preventDefault();
        var params = [];
        if (q.trim()) params.push('where=' + encodeURIComponent(q.trim()));
        if (date) params.push('when=' + encodeURIComponent(date));
        location.href = 'volunteer.html' + (params.length ? '?' + params.join('&') : '');
      }
      return h('form', { className: 'gp-finder', role: 'search', 'aria-labelledby': 'gp-finder-title', onSubmit: submit },
        h('h3', { id: 'gp-finder-title', className: 'gp-finder__title ' + (mobile ? 'heading-h4-mobile' : 'heading-h4') }, d.book.finderTitle),
        h('div', { className: 'gp-finder__fields' },
          h('div', { className: 'gp-finder__search' },
            h(F.Search, { label: 'City or ZIP code', showLabel: true, placeholder: '55433 or Coon Rapids', name: 'where', autoComplete: 'off',
              value: q, onChange: function (e) { setQ(e.target.value); }, onClear: function () { setQ(''); } })),
          h('div', { className: 'gp-finder__select' },
            h(F.Dropdown, { label: 'Date', showLabel: true, placeholder: 'Any date', options: DATE_OPTIONS, value: date, onChange: setDate })),
          h('div', { className: 'gp-finder__select' },
            h(F.Dropdown, { label: 'How many are coming?', showLabel: true, placeholder: 'Group size', options: SIZE_OPTIONS, value: size, onChange: setSize })),
          h('div', { className: 'gp-finder__submit' },
            h(F.Button, { type: 'submit', variant: 'primary', size: 'large', fullWidth: mobile }, 'Find a packing time'))));
    }

    function Page() {
      var mobile = F.useIsMobile();
      useMobileCardTitles(mobile);
      var hx = function (c) { return mobile ? c + '-mobile' : c; };

      return h(Fragment, null,
        h(window.SiteNav, { current: 'how-to-help' }),

        h('main', { className: 'gp-page gp-page--' + d.slug },
          /* 1 · Hero */
          h(F.Hero, {
            breakpoint: 'auto',
            type: 'standard',
            eyebrow: d.hero.eyebrow,
            h1: d.hero.h1,
            body: d.hero.body,
            primaryLabel: d.hero.primaryLabel, primaryHref: 'signup-1.html',
            secondaryLabel: 'See how booking works', secondaryHref: '#book',
            image: img(d.hero.image),
            imageAlt: d.hero.imageAlt
          }),

          /* 2 · Why (Section · Card grid, three Feature cards) */
          h(F.SectionCardGrid, {
            breakpoint: 'auto', columns: 3, className: 'gp-grid gp-why',
            header: { align: 'left', showEyebrow: false, showSupporting: false, heading: d.why.heading },
            items: d.why.cards.map(function (c, i) {
              return h(F.FeatureCard, { key: i, color: 'white', showButton: false, image: img(c.image), imageAlt: c.alt, title: c.title, description: c.description });
            })
          }),

          /* 3 · Scripture (Churches only) */
          d.scripture ? h(F.SectionQuoteBand, {
            breakpoint: 'auto', className: 'gp-quote',
            quote: d.scripture.quote, attribution: d.scripture.attribution, showAttribution: true
          }) : null,

          /* Book your … in three steps (#book) */
          h('section', { className: 'gp-section', id: 'book', 'aria-labelledby': 'gp-book' },
            h('div', { className: 'gp-inner' },
              h(Header, { id: 'gp-book', heading: d.book.heading, supporting: d.book.supporting }),
              h('div', { className: 'gp-steps-panel' },
                h('ol', { className: 'gp-steps' }, d.book.steps.map(function (s, i) {
                  return h(Step, { key: i, number: String(i + 1), title: s[0], description: s[1] });
                }))),
              h('ul', { className: 'gp-facts body-small' }, FACTS.map(function (f) {
                return h('li', { key: f[0], className: 'gp-fact' }, h(F.Icon, { name: f[0], size: 24 }), h('span', null, f[1]));
              })),
              h('p', { className: 'gp-account body-base' }, ACCOUNT_LINE),
              h(Finder))),

          /* Employer matching (Workplaces only) */
          d.matching ? h('section', { className: 'gp-match', id: 'matching', 'aria-labelledby': 'gp-match-h' },
            h('div', { className: 'gp-match__row' },
              h('div', { className: 'gp-match__copy' },
                h('h2', { id: 'gp-match-h', className: hx('heading-h3') }, 'Your employer may double it'),
                h('p', { className: 'body-base' }, 'Thousands of companies match employee donations, and many match volunteer hours too. Search for your employer to find out.')),
              h('div', { className: 'gp-match__actions' },
                h(F.Search, { label: 'Search for company', placeholder: 'Search for company' }),
                h('p', { className: 'gp-match__credit body-small' },
                  h('img', { src: img('donate-double-the-donation.svg'), alt: '' }),
                  'All information provided by Double the Donation')))) : null,

          /* More ways your … can help (Section · Card grid, Badge cards) */
          h(F.SectionCardGrid, {
            breakpoint: 'auto', columns: d.more.cards.length, className: 'gp-grid gp-more',
            header: { align: 'left', showEyebrow: false, showSupporting: false, heading: d.more.heading },
            items: d.more.cards.map(function (c) {
              return { title: c.title, body: c.body, illustration: img(c.illustration), linkLabel: c.linkLabel, href: c.href };
            })
          }),

          /* Questions … ask */
          h(F.SectionFAQ, {
            breakpoint: 'auto',
            className: 'gp-faq',
            header: { align: 'left', showEyebrow: false, showSupporting: false, heading: d.faq.heading },
            items: d.faq.items, showLink: true, linkLabel: 'Read the volunteering policies', linkHref: '#'
          }),

          /* CTA band */
          h(F.CTABand, {
            breakpoint: 'auto',
            className: 'gp-cta',
            eyebrow: '',
            headline: d.cta.headline,
            subtext: 'Each meal costs 29 cents, and volunteers pack every one by hand.',
            primaryLabel: d.hero.primaryLabel, primaryHref: 'signup-1.html',
            secondaryLabel: d.cta.secondaryLabel, secondaryHref: 'give.html',
            showTrustStrip: false
          })),

        h(F.Footer, {
          breakpoint: 'auto',
          logoSrc: img('fmsc-logo-text-only.png'),
          /* Figma footer copy differs from the DS defaults ("Our finances", "Host an FMSC MobilePack™ event"). */
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

    ReactDOM.createRoot(document.getElementById('root')).render(h(Page));
  }

  window.renderGroupsPage = renderGroupsPage;
})();
