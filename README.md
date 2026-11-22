# Turning Point — website

A static site (plain HTML / CSS / JavaScript, no build step). It runs as-is on
GitHub Pages and on any ordinary web server, including the university's.

```
index.html                 the homepage / container
css/style.css              all styling — grid, type, animation
js/content.js              ALL TEXT AND MEDIA — edit here or with the editor
admin/index.html           the editor (see "Editing content")
admin/layout.html          the layout console (grid, gutters, placement)
js/rd.js                   reaction–diffusion engine (WebGL2), shared
js/main.js                 intro sequence, layout of the strips, panels
assets/img/                texture.jpg (the steel fill), images
assets/img/explore/        portrait thumbnails for the five explorations
assets/uploads/            files uploaded through the editor
assets/video/              videos + poster frames
explorations/
  shared/explore.css       shared top bar / info panel for explorations
  metamorphosis/           BUILT copy of the three.js prototype (see below)
  confluence/ flux/ emergence/   placeholder pages to build in
  perforation/             a working interactive piece (touch to grow)
  _template/               copy this to start a new exploration
.nojekyll                  tells GitHub Pages to serve files untouched
```

## Previewing locally

Browsers refuse to use local image files inside WebGL, so opening
`index.html` by double-clicking shows the pattern with a flat rust fill
instead of the texture. Run a tiny local server from this folder instead:

```
python -m http.server 8000
```

then open <http://localhost:8000>. (VS Code's "Live Server" works too.)

## Editing content

### With the editor — `admin/index.html`

Open `…/admin/` in a browser (locally through the server above, or on the
live site). Everything on the homepage can be edited there: title, intro
paragraphs, social links, and every section and box — add, edit, reorder,
duplicate, delete. Images and videos can be uploaded; they are stored in
`assets/uploads/`, and the aspect ratio is filled in for you.

Edits stay in the editor until you save. There are three ways to save:

* **Open site folder** (Chrome or Edge): pick this site folder once; *Save*
  then writes `js/content.js` and uploads straight into it. Upload the
  folder to GitHub / the server as usual afterwards.
* **GitHub…**: enter the repository (`owner/name`), branch, and a
  fine-grained personal access token with *Contents: read and write* on
  that one repository. *Save* and uploads become commits; the live site
  updates about a minute later. The token is only kept in this browser,
  and only if you tick "Remember".
* **Download content.js**: works anywhere; replace `js/content.js` with the
  downloaded file by hand. (Uploads need one of the two options above.)

**Preview draft** opens the site with your unsaved edits (marked with a
"Draft preview" badge) — only you see it, in that browser.

The editor page is public if you deploy it, but it can't change anything
without your folder or your token. To leave it off the live site, simply
don't upload the `admin/` folder.

### Layout console — `admin/layout.html`

For locking in the wide-screen layout. Open `…/admin/layout.html` through the
local server (in Chrome or Edge). It draws the module grid over each page
(Home, a section, Structure & Process, Explore) with every part where the
site puts it. Change the grid (columns, rows, how much of the window it
fills, square modules), add column and row gutters, set the two fonts, and
drag, snap and resize the parts; Alt drags free. The live page or a mock-up
image can sit underneath for comparison.

**Save to site** (Ctrl+S) writes two files into this folder — pick the
folder once, the first time:

* `css/layout.css` — the layout as CSS. `index.html` loads it after
  `style.css`, so it wins. Reload the site to see it. Don't edit it by hand;
  save again from the console. Delete it to go back to `style.css` alone.
* `admin/layout.json` — every number; the console opens it next time, so the
  layout travels with the repository.

Commit both and push as usual. In browsers that can't write to folders,
Save downloads the two files to put in place by hand.

### By hand

`js/content.js` is plain JavaScript (`window.SITE = {…}`). Box types —
`text`, `image`, `video`, `embed` (YouTube/Vimeo), `project`, `event`,
`credits`, `links` — and their fields are listed in the editor. `span:
1 | 2 | 3 | 4` sets how many of the four columns a box covers on desktop;
on phones every box is full width.

* **Horizontal sections**: give a section `"layout": "horizontal"` (or pick
  *Layout → Horizontal* in the editor) and on desktop its header stays put
  while the content runs sideways at full height — images, video and
  carousels sized to the height, long text flowing into columns. The mouse
  wheel, a drag, the arrow keys or the ← → buttons move it. Phones keep the
  normal vertical scroll. Structure & Process uses this.
* **Carousel**: several images in one box, swiped or stepped with arrows.
  In the editor, tick images (☐) and press *Combine into carousel*; the ⇹
  button on a carousel splits it back into separate images.
* **Explore**: consecutive `project` boxes form one sideways-scrolling row
  of tall cards (thumbnails look best portrait, about 5:7). A project with
  an empty `href` shows as "Forthcoming"; `newTab: true` opens it in a new tab.
* **Events** are shown in the order you list them; past dates are dimmed
  and labelled "Past" automatically.
* **Sections** can be renamed, reordered, added or removed — the menu is
  built from the list. Each opens at `#its-id`, so `…/index.html#events`
  is a shareable link straight to Events.

## How the page behaves

* Opening: the pattern grows in the left half while the title fades in
  in place; then the text and the menu appear. Click / key skips it.
* Opening a section (desktop): the pattern's layers slide out to the left,
  the right-hand column slides away, and the content
  takes the full width. Hover the right edge (or "← Menu" at the top
  right) to slide the menu back in. "← Back" (or Esc) returns home.
* Phones: the layers merge into a single band of pattern pinned to the
  top of the screen.
* Everything enters by sliding and being uncovered — no fades.

## Adding an exploration

1. Copy `explorations/_template/` to e.g. `explorations/my-piece/` (or fill
   in one of the four placeholder folders).
2. Build the piece inside its `index.html` (canvas, p5.js, Three.js, video…).
   It can reuse the pattern engine: `<script src="../../js/rd.js">` —
   see `perforation/` for a full example.
3. Add a `{ type: "project", … href: "explorations/02-my-piece/index.html" }` box to
   the Explore section in `js/content.js`.

## Updating Metamorphosis (the three.js prototype)

`explorations/metamorphosis/` is the *built* output of the Vite project in
`TOMB_Prototype 01`, not its source. After changing the prototype, rebuild
it into this folder from the prototype's folder:

```
npm run build -- --base ./ --outDir "G:/GIT/TURNING-POINT/explorations/metamorphosis" --emptyOutDir
```

`--base ./` makes every path relative so it works inside a sub-folder (it
still works at the root, e.g. on Netlify). The prototype loads its data
with relative paths (`data/…`, `models/…`) for the same reason, and shows
an "← Explore" link back to the site only when it runs under
`/explorations/`. Then change the `<title>` in the built `index.html` if
you like, and commit.

## Changing the look of the pattern

* **Steel texture:** `assets/img/texture.jpg` (square, ~900–1200 px) is the
  cor-ten. The colour version uses `assets/img/texture-blue.jpg`, a recolouring
  of it into the teals, blues, violet and green of the mockup; the black and
  white version still uses the original. To use the cor-ten again, change
  `TEXTURE` in `js/main.js` (and `RIM`, the dark edge around the cuts:
  0 = clean white cuts).
* **Grid (wide screens):** the home page sits on a grid of 15 × 8 square
  modules, centred in the window. The module `--u` and the margins (`--pl`
  left, `--mt` top and bottom) are in the `@media (min-width: 821px)` block
  at the end of `css/style.css`, followed by the placement of each part in
  modules: pattern in columns 1–6 / rows 2–8, with the university logo
  (`assets/img/anu-logo.png`, `.org` in `index.html`) in its bottom-left
  corner; the smaller squares round the logo, to `LOGO_PAD` (a quarter module)
  beyond it and rounded out to whole smaller squares, are always left empty
  so the pattern never covers it (`keepOut` in `js/main.js`). On phones the
  logo sits under the pattern; headline and text from
  column 7, "Turning Point." (in `--title-ink`, the blue) and the menu at
  column 12, the links in row 1 beside an outline square (`.mark`) at the
  top of column 15, the pattern strip in column 15, rows 3–8. Add `?grid` to the address to see the grid
  drawn over the page.
* **Section pages (wide screens):** the same grid, fonts and blue. A section
  sits in columns 1–14 below the top row: its title in row 2 (in
  title case: headings written in capitals in `content.js` are converted), the
  lede in columns 7–10 like the home page's text, "← Back." at the end of
  column 14, and the content from row 3. In the sideways sections every
  image, text column and card is a whole number of modules wide (images are
  rounded to the nearest module and cropped a little to fit; text columns
  are 4 modules, cards 3), less a small gap `--hg`, so everything starts on a
  module line. Events and credits use 14 module columns (`span` 1–4 in
  `content.js` = 4, 7, 10 or 14 modules). The block "Section pages on the
  home page's grid" near the end of `css/style.css`.
* **Feature layout (Structure & Process):** `"layout": "feature"` in
  `content.js` (or "Feature" in the editor). On wide screens the section fills
  the frame: every image, carousel slide and video of the section in one big
  carousel on the left (columns 1–9, full height) with the title over it in
  white, and all its text in one column (9½–13½) beside it. Click the image to
  look: the title fades, the image widens to column 11 and the text drops down
  so only the start of its part shows at the bottom, the white veil dropping
  with it so it lies only under the text;
  click again for the next image (or drag, or the arrows that show on hover).
  Each image belongs to the text before it in `content.js` (images before the
  first text, to the first), so the column follows the image: flipping to an
  image of another part brings that part's text up. Moving the mouse off the
  image slides the text back up. Scroll to read: the text runs over the veiled
  edge of the image, and reading on into another part brings up its first
  image; scrolling up past the top goes back to the image. The CSS block
  "Feature section" at the end of `css/style.css`, `initFeature()` in
  `js/main.js`. Phones show the section as a normal page.
* **Explorations:** a sideways section made only of explorations (`project`
  items) shows just the thumbnails, each with its number and title, linking to
  the exploration: no description or status (on phones too). On wide screens
  the title sits at the top left, the cards
  (5 : 7 thumbnails) run from under it to the bottom of the frame and are cut
  at column 13; scroll or drag sideways for the rest. The CSS block
  "Explorations" at the end of `css/style.css`.
* **Coming soon:** `"comingSoon": true` on a section in `content.js` (or the
  tick box in the editor) shows only its title and "Coming soon." — the
  boxes are kept, so unticking it brings them back. Events is set this way.
* **Strip in the sections:** while a section is open the pattern strip on the
  right is drawn as black outlines, row by row as the rows slide away
  (`style` of the strip's squares in `layout()` in `js/main.js`).
* **Colour:** `--accent` (the blue, `#449ad4`) at the top of `css/style.css`
  is used for every highlight: "Turning Point.", the section numbers, figure
  numbers, dates, links and the active menu item, on phones too.
* **Phones:** "Turning Point." and the
  links, the text, the pattern under the text and the logo under that (in a
  section there is no pattern band at the top); the menu at the bottom is
  in the bold italic of the wide-screen menu. The block "Phones" at the end
  of `css/style.css`.
* **Fonts:** headings use `--display` ("Argent CF" first, then the
  self-hosted stand-in Fraunces, bold, as "TP Display"); text uses `--text`
  ("Gyst" first, then Commissioner as "TP Text"). The stand-ins are in
  `assets/fonts/`. Once Argent CF and Gyst are licensed for the web, add
  their `@font-face` rules (or the Adobe Fonts link for Argent) at the top of
  `css/style.css` and they take over with no other change.
* **Opening text:** `preface` in `js/content.js` (first line, paragraphs,
  button label; also in the editor under "Title, intro & links"). It shows
  before the pattern and the title until the button is pressed, then
  dissolves along a pattern (`assets/img/dissolve.png`) as the real one grows
  beneath it. It is skipped
  on links straight to a section (`#explore`) and once it has been seen in
  that browser tab. Empty it to go straight to the site.
* **Blocks:** the pattern area is cut into blocks on a grid of squares
  (squares, 2×2 blocks, rectangles and L shapes) with no gaps between them.
  Every square is split into smaller squares (`TILE_SUB`, 2 = 2×2) and about
  half of them are left empty (`TILE_EMPTY`, now 0.48): bitten out of the
  edges, with a few holes (`TILE_INNER`, 3–6) in the middle, some of them a
  whole square, so the area has a different incomplete outline on each
  visit (`shapeMask`). Blocks show the steel texture at different zooms
  (`TILE_ZOOMS`), and a few are drawn as ink outlines. The right-hand strip
  is cut the same way (`SLIVER_EMPTY`, 0.25). All of this is in `gridPlan`
  and `layout` in `js/main.js`.
* **Mouse:** on wide screens the pattern inside the squares pans with the
  mouse, left and right (and a little up and down).
* **Click ripple:** a click in the pattern area ripples a new pattern out
  from that point (`RIPPLE_R`, `RIPPLE_STEPS` in `js/main.js`; `ripple()` in
  `js/rd.js`).
* **Menu hover:** on wide screens, hovering a menu item spreads a pattern
  through its letters from the cursor: the word fills with the blue steel cut
  by white channels. It is a small second simulation on a canvas over the
  menu (section 7 of `js/main.js`): `CELL_EM` sets how fine it is, `SPREAD`
  how fast it spreads, `SEED_GAP` how densely it is sown. It is off on touch
  screens and in the black-and-white theme.
* **Motion speed:** two variables at the top of `css/style.css`. `--speed`
  sets every transition and entrance (boxes, images, the strips sliding away,
  section changes, the opening sequence, hovers); `--pattern-speed` sets how
  fast the pattern grows and follows the mouse. 1 = as built, 0.5 = half as
  fast, 2 = twice as fast. Both are now 0.5.
* **Motion:** fast in, crisp stop. The curves are `--ease`, `--ease-out` and
  `--snap` (a slight overshoot that settles, for things that slide in) at the
  top of `css/style.css`; durations sit beside each `transition`. Images are
  uncovered from the left while sliding in. The strips' slide when a section
  opens is `collapse()` in `js/main.js` (420 ms), the pattern's growth speed
  is the steps-per-second in `tick()`, and the easing of the mouse-follow,
  turn and twist is the `approach(...)` rates there.
* **Density:** `DENSITY` at the top of `js/main.js` (1 = the first version,
  2 = twice as fine). Try values without editing by adding `?density=1.5` to
  the address. Phones are capped at `DENSITY_PHONE_MAX` (1.5): finer cuts
  are hard to read on a small screen and the grid gets heavy for phone GPUs.
  Every step of density multiplies the simulation work by its square, so
  check the opening on an older laptop after raising it.
* **Layer behind:** a finer, still pattern fills the content area between
  the top and bottom of the strips. It is a pre-rendered seamless tile
  (`assets/img/pattern-tile.png`, used as a mask) so it costs nothing at
  runtime. It stays on in the section pages too. In `css/style.css`: `--bg-ink` (colour), `--bg-alpha` (opacity
  behind the strips), `--bg-text` (fraction of that behind the text),
  `--bg-tile` (tile size — smaller is denser).
* **Black and white / colour:** `<html data-theme="mono">` in `index.html`
  gives the black-and-white version on paper (`assets/img/paper.jpg`; the colour version is now on plain white, `--surface`), with
  the steel in greyscale, photos in greyscale and slightly bled, ink-like
  type. The default is now `data-theme="color"`; change it to `mono` for black and white — or try
  either without editing with `?theme=color` / `?theme=mono` in the address.
  The theme colours are the `[data-theme="mono"]` block at the top of
  `css/style.css`; the ink bleed is `--ink-bleed` plus the `#ink` SVG filter
  in `index.html` (its `scale` sets how rough the large type gets).
* **Resting-cursor pattern:** switched off (`ENABLED = false` in section 6
  of `js/main.js`); set it to `true` to bring it back.
* **Number of layers:** `N_DESKTOP` / `N_MOBILE` / `N_BAND` in `js/main.js`.
* **Lines vs. dots, thickness, scale:** options passed to
  `new TurningPattern(…)` in `js/main.js` — `dotBias` (−1 lines … +1 dots),
  `anisotropy` (how strongly lines align), `threshold` (cut thickness:
  lower = wider cuts), `texturePx` (scale of the steel image).
* **Colours, type sizes, margins:** CSS variables at the top of `css/style.css`.

## Publishing on GitHub Pages

1. Create a repository and upload the contents of this folder (so
   `index.html` sits at the top level).
2. Repository → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. The site appears at `https://<user>.github.io/<repo>/` after a minute.

## Moving to the university server

Copy the whole folder to the web directory. All links are relative, so it
works in a sub-folder (e.g. `…/turning-point/`) without changes. The only
external resource is Google Fonts; to self-host the fonts, download
*Source Sans 3* and *Cormorant Garamond*, put them in `assets/fonts/`, and
replace the `<link href="https://fonts.googleapis.com/…">` lines with
`@font-face` rules.

## Notes

* Needs WebGL2 for the animated pattern (all current desktop and phone
  browsers). Without it, the stage falls back to the static texture.
* Visitors with "reduce motion" turned on get the finished layout
  without the intro choreography.
* Click / tap / any key during the intro skips it.
* `assets/img/structure.jpg` is cropped from the mock-up; `detail-*.jpg`,
  the exploration thumbnails and `assets/video/growth.mp4` are placeholders
  generated from the texture and the pattern simulation.
