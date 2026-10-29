# FMSC.org redesign — usability-test prototype

A clickable HTML prototype of the FMSC.org redesign, used for usability testing. It's built from the Client Prototype Figma file (the "Usability test · Desktop" and "Usability test · Mobile" pages) on a coded version of the FMSC Design System.

- **Live site:** https://jonnyslt.github.io/fmsc-prototype/ (GitHub Pages, `docs/` folder on `main`).
- **Start page:** `docs/index.html` (signed-out homepage).
- **Not for search engines:** every page carries `noindex, nofollow`, and `docs/robots.txt` disallows crawling.

## Sign-in states

The prototype starts signed out. Sign in shows Sarah Whitfield's full account; Create account shows the empty "New account" pages. The state is kept per browser tab (sessionStorage), so a new tab starts signed out again.

To open any page in a given state, add `?auth=out`, `?auth=sarah` or `?auth=new` to its address, for example `account-dashboard.html?auth=sarah`.

## Structure

| Path | What it is |
|---|---|
| `docs/*.html` | One page per prototype screen (desktop and mobile in the same responsive page) |
| `docs/ds/` | The FMSC Design System bundle (tokens, CSS, React components) |
| `docs/lib/` | React runtime |
| `docs/img/` | Photos, illustrations and logos |
| `docs/site-nav.js` | Shared nav, sign-in state and link rules |
| `docs/account-shell.js` | Shared layout for the account pages |
| `docs/signup-shell.js`, `docs/flow-data.js` | Volunteer sign-up flow and sample data |
| `docs/people-picker.js` | People list, Add someone and Share a link (sign-up confirmations and event details) |
| `docs/groups-page.js` | Shared layout for the Groups pages (churches, schools, workplaces, families) |
| `docs/give-shell.js`, `docs/give.html` | Give (donate) flow: shared blocks and gift store; `give.html` routes to A1 (signed in) or C1 (signed out) |

No build step: the files are served as they are.

Maintained by Straight Line Theory.
