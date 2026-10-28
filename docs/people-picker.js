/* People picker — shared by the sign-up confirmations (signup-b4, -c4, -d4) and event-upcoming.html.
   Figma (Designs, Oct. 27, 2026): "Next: fill your spots" / "From your group" lists, "Add someone" and "Share a link".
   Load after ds/bundle.js, site-nav.js (window.FMSCToast) and flow-data.js. Exposes window.PeoplePicker:

     List      — search, then the people as a checkbox table (desktop: Select · Name · Email) or a checkbox list with
                 "Select all" (mobile), then the pager. Checking a person claims a spot for them and unchecking frees it;
                 each change shows the Added / Removed toast (Figma prototype: checkbox click → Toast overlay, 2 seconds).
     AddSomeone — "Not in your group? Add them": Adult / Under 18, first name, last name, email (optional), Add.
     ShareLink  — the invite link with Copy link, and the shift's join code with a copy button.

   Every value is an FMSC DS token (pp- classes below). */
(function () {
  var h = React.createElement, F = window.FMSC;
  var CSS = [
    '.pp-list { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-sm); min-width: 0; align-self: stretch; }',
    '.pp-list > .pp-table, .pp-list > .pp-people, .pp-list > .fm-pagination, .pp-list > .pp-empty { align-self: stretch; }',
    '.pp-search { width: 360px; max-width: 100%; }',
    /* Desktop table: 1px border-default box (radius-lg); Select column 64, Name and Email share the rest. */
    '.pp-table { border: 1px solid var(--border-default); border-radius: var(--radius-lg); overflow: hidden; }',
    '.pp-table .fm-dtable, .pp-table .fm-dtable__table { width: 100%; }',
    '.pp-table .fm-dtable__table { table-layout: fixed; }',
    '.pp-table .fm-dtable__table tr > :first-child { padding-left: var(--space-lg); }',
    '.pp-table .fm-dtable__table td:not(:first-child), .pp-table .fm-dtable__table th:not(:first-child) { overflow-wrap: anywhere; }',
    /* Mobile list: Select all, then one person per row, space-xs apart (space-sm in the event page group list). */
    '.pp-people { display: flex; flex-direction: column; gap: var(--space-xs); margin: 0; padding: 0; list-style: none; min-width: 0; }',
    '.pp-people--roomy { gap: var(--space-sm); }',
    '.pp-empty { color: var(--content-secondary); }',
    '.pp-list > .fm-pagination { padding-left: 0; padding-right: 0; }',
    /* Add someone */
    '.pp-add { display: flex; flex-direction: column; gap: var(--space-sm); min-width: 0; }',
    '.pp-add__head { display: flex; flex-direction: column; gap: var(--space-3xs); }',
    '.pp-add__title { color: var(--content-primary); }',
    '.pp-add__body { max-width: 607px; color: var(--content-secondary); }',
    '.pp-add__age { display: flex; gap: var(--space-lg); margin: 0; padding: 0; border: 0; }',
    '.pp-add__fields { display: flex; align-items: flex-end; gap: var(--space-sm); }',
    '.pp-add__fields > .fm-field { flex: 1 1 0; min-width: 0; }',
    '.pp-add__fields > .fm-btn { flex: none; }',
    /* Share a link */
    '.pp-share { display: flex; flex-direction: column; gap: var(--space-md); min-width: 0; }',
    '.pp-share__link { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-sm); }',
    '.pp-share__link > .fm-field { align-self: stretch; }',
    '.pp-share--row .pp-share__link { flex-direction: row; align-items: flex-end; }',
    '.pp-share--row .pp-share__link > .fm-field { flex: 1 1 0; min-width: 0; }',
    '.pp-share--row .pp-share__link > .fm-btn { flex: none; }',
    '.pp-share .fm-field__input { cursor: pointer; }',
    '.pp-code { display: flex; flex-direction: column; }',
    '.pp-code__intro { color: var(--content-secondary); }',
    '.pp-code__row { display: flex; align-items: center; gap: var(--space-xs); }',
    '.pp-code__btn { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--content-primary); cursor: pointer; }',
    '.pp-code__btn:hover { background: var(--background-subtle); }',
    '@media (max-width: 599.98px) {',
    '  .pp-search { width: 100%; }',
    '  .pp-add__fields { flex-direction: column; align-items: stretch; }',
    '  .pp-add__fields > .fm-field { flex: none; }',
    '  .pp-add__fields > .fm-btn, .pp-share__link > .fm-btn { width: 100%; align-self: stretch; }',
    '  .pp-share--row .pp-share__link { flex-direction: column; align-items: stretch; }',
    '}'
  ].join('\n');
  if (!document.getElementById('pp-css')) { var st = document.createElement('style'); st.id = 'pp-css'; st.textContent = CSS; document.head.appendChild(st); }

  function display(name) { var P = window.FMSCData && window.FMSCData.profile; return P ? P.display(name) : name; }
  function toast(on) { if (window.FMSCToast) window.FMSCToast.show(on ? 'Added' : 'Removed'); }

  /* List. props: people [{ name, desc, email }] (desc already says "has a spot" when they have one), checked { name: bool },
     onToggle(name, on), room (open spots; unchecked rows are disabled at 0), searchLabel, count (pager text), mobile,
     roomy (event page spacing), id. */
  function List(p) {
    var q = React.useState(''), query = q[0], setQuery = q[1];
    var needle = query.trim().toLowerCase();
    var shown = p.people.filter(function (x) { return !needle || display(x.name).toLowerCase().indexOf(needle) >= 0; });
    var open = shown.filter(function (x) { return !p.checked[x.name]; });
    var all = shown.length > 0 && !open.length;
    var some = shown.some(function (x) { return p.checked[x.name]; });
    function set(name, on) {
      if (on && p.room <= 0) return;
      p.onToggle(name, on); toast(on);
    }
    function setAll(on) {
      if (on) { var names = open.slice(0, Math.max(0, p.room)).map(function (x) { return x.name; }); if (!names.length) return; p.onToggleAll(names, true); toast(true); }
      else { var on2 = shown.filter(function (x) { return p.checked[x.name]; }).map(function (x) { return x.name; }); if (!on2.length) return; p.onToggleAll(on2, false); toast(false); }
    }
    var full = p.room <= 0;
    var search = h('div', { className: 'pp-search' }, h(F.Search, { label: p.searchLabel, placeholder: p.searchLabel, value: query,
      onChange: function (e) { setQuery(e.target.value); }, onClear: function () { setQuery(''); } }));
    var empty = shown.length ? null : h('p', { className: 'pp-empty body-small', role: 'status' }, 'No one in this list matches “' + query.trim() + '”.');
    var pager = h(F.Pagination, { count: p.count, ariaLabel: 'People pages', previousLabel: 'Previous people', nextLabel: 'Next people' });
    if (p.mobile) {
      return h('div', { className: 'pp-list', role: 'group', 'aria-labelledby': p.labelledBy },
        search,
        shown.length ? h(F.Checkbox, { label: 'Select all', description: 'Only people who can still join', checked: all, indeterminate: some && !all,
          onChange: function (e) { setAll(e.target.checked); } }) : null,
        shown.length ? h('ul', { className: 'pp-people' + (p.roomy ? ' pp-people--roomy' : '') }, shown.map(function (x) {
          var on = !!p.checked[x.name];
          return h('li', { key: x.name }, h(F.Checkbox, { label: display(x.name), description: [x.desc, x.email].filter(Boolean).join(' · '), checked: on,
            disabled: !on && full ? true : undefined, onChange: function (e) { set(x.name, e.target.checked); } }));
        })) : empty,
        pager);
    }
    var columns = [
      { key: 'select', label: 'Select', cells: 'checkbox', width: 64,
        header: { checkboxLabel: 'Select all', checked: all, checkboxSelected: some && !all ? 'indeterminate' : undefined, onCheckboxChange: function (e) { setAll(e.target.checked); } } },
      { key: 'name', label: 'Name', cells: 'stacked' },
      { key: 'email', label: 'Email', cells: 'text' }
    ];
    var rows = shown.map(function (x) {
      var on = !!p.checked[x.name];
      return {
        select: { checked: on, checkboxLabel: display(x.name), disabled: !on && full ? true : undefined, onChange: function (e) { set(x.name, e.target.checked); } },
        name: { value: display(x.name), secondary: x.desc },
        email: x.email || 'No email'
      };
    });
    return h('div', { className: 'pp-list', role: 'group', 'aria-labelledby': p.labelledBy },
      search,
      shown.length ? h('div', { className: 'pp-table' }, h(F.DataTable, { breakpoint: 'desktop', caption: p.caption || 'People', columns: columns, rows: rows, count: p.count,
        pagination: { ariaLabel: 'People pages', previousLabel: 'Previous people', nextLabel: 'Next people' } })) : empty);
  }

  /* AddSomeone. props: title, titleClass ('label-base' | 'label-large'), onAdd({ name, desc, email, minor }), id. */
  var addId = 0;
  function AddSomeone(p) {
    var idRef = React.useRef(null); if (idRef.current == null) idRef.current = 'pp-add-' + (++addId);
    var s = React.useState({ age: 'adult', first: '', last: '', email: '' }), v = s[0], setV = s[1];
    function upd(k) { return function (e) { var n = Object.assign({}, v); n[k] = e.target.value; setV(n); }; }
    function add(e) {
      e.preventDefault();
      var name = (v.first.trim() + ' ' + v.last.trim()).trim();
      if (!name) return;
      var minor = v.age === 'minor', email = v.email.trim();
      /* No line under a person added here: Figma has none (Jonny, Oct. 27, 2026). */
      p.onAdd({ name: name, email: email, minor: minor, desc: '' });
      toast(true);
      setV({ age: v.age, first: '', last: '', email: '' });
    }
    return h('form', { className: 'pp-add', 'aria-labelledby': idRef.current + '-title', onSubmit: add },
      h('div', { className: 'pp-add__head' },
        h('h3', { className: 'pp-add__title ' + (p.titleClass || 'label-base'), id: idRef.current + '-title' }, p.title),
        h('p', { className: 'pp-add__body body-base' }, 'Include an email and we’ll send them an invitation. No email? They’re added as a guest, and you check them in.')),
      h('fieldset', { className: 'pp-add__age' },
        h('legend', { className: 'fm-visually-hidden' }, 'Age'),
        h(F.Radio, { name: idRef.current + '-age', value: 'adult', label: 'Adult', checked: v.age === 'adult', onChange: function () { setV(Object.assign({}, v, { age: 'adult' })); } }),
        h(F.Radio, { name: idRef.current + '-age', value: 'minor', label: 'Under 18', checked: v.age === 'minor', onChange: function () { setV(Object.assign({}, v, { age: 'minor' })); } })),
      h('div', { className: 'pp-add__fields' },
        h(F.Input, { label: 'First name', value: v.first, onChange: upd('first'), name: 'first-name', autoComplete: 'off' }),
        h(F.Input, { label: 'Last name', value: v.last, onChange: upd('last'), name: 'last-name', autoComplete: 'off' }),
        h(F.Input, { label: 'Email (optional)', type: 'email', value: v.email, onChange: upd('email'), name: 'email', autoComplete: 'off' }),
        h(F.Button, { variant: 'secondary', size: 'medium', type: 'submit' }, 'Add')));
  }

  /* ShareLink. props: url, code, row (link field and button side by side on desktop), href (where the link field opens:
     the public event page). The heading and note come from the page. */
  function copy(text, done) { try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text); } catch (e) {} if (done) done(); }
  function ShareLink(p) {
    var a = React.useState(''), said = a[0], say = a[1];
    function announce(t) { say(''); setTimeout(function () { say(t); }, 30); }
    function open(e) { if (e.type === 'keydown' && e.key !== 'Enter') return; location.href = p.href || 'event-summary.html'; }
    return h('div', { className: 'pp-share' + (p.row ? ' pp-share--row' : '') },
      h('div', { className: 'pp-share__link', onClick: function (e) { if (e.target.tagName === 'INPUT') open(e); }, onKeyDown: function (e) { if (e.target.tagName === 'INPUT') open(e); } },
        h(F.Input, { label: 'Link for this shift', value: p.url, onChange: function () {}, name: 'shift-link', autoComplete: 'off' }),
        h(F.Button, { variant: 'primary', size: 'medium', icon: 'copy', type: 'button', onClick: function () { copy('https://' + p.url, function () { announce('Link copied'); }); } }, 'Copy link')),
      h('div', { className: 'pp-code' },
        h('p', { className: 'pp-code__intro body-small' }, 'Joining on fmsc.org? Use this shift’s code:'),
        h('div', { className: 'pp-code__row' },
          h('span', { className: 'body-base' }, p.code),
          h('button', { type: 'button', className: 'pp-code__btn fm-focusable', 'aria-label': 'Copy the code ' + p.code, onClick: function () { copy(p.code, function () { announce('Code copied'); }); } },
            h(F.Icon, { name: 'copy', size: 20 })))),
      h('span', { className: 'fm-visually-hidden', role: 'status', 'aria-live': 'polite' }, said));
  }

  window.PeoplePicker = { List: List, AddSomeone: AddSomeone, ShareLink: ShareLink };
})();
