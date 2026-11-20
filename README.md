# Turning Point — website

A static site (plain HTML / CSS / JavaScript, no build step). It runs as-is on
GitHub Pages and on any ordinary web server, including the university's.

```
index.html                 the homepage / container
css/style.css              all styling — grid, type, animation
js/content.js              ALL TEXT AND MEDIA — edit here or with the editor
admin/index.html           the editor (see "Editing content")
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

* **Steel texture:** replace `assets/img/texture.jpg` (square, ~900–1200 px).
* **Active area:** on wide screens everything sits inside a margin: `--ax`
  (left), `--ax2` (right) and `--mt` (top and bottom) at the top of
  `css/style.css`; `--sl` is the width of the right-hand pattern strip.
* **Opening text:** `preface` in `js/content.js` (first line, paragraphs,
  button label; also in the editor under "Title, intro & links"). It shows
  before the pattern and the title until the button is pressed, then
  dissolves along a pattern (`assets/img/dissolve.png`) as the real one grows
  beneath it. It is skipped
  on links straight to a section (`#explore`) and once it has been seen in
  that browser tab. Empty it to go straight to the site.
* **Blocks:** the rows are cut into blocks on a grid of squares (squares,
  rectangles and L shapes) with no gaps between them. Every square is split
  into smaller squares (`TILE_SUB`, 2 = 2×2) and 30% of them are left empty
  (`TILE_EMPTY`): bitten out of the edges of the pattern area, with two or
  three (`TILE_INNER`) singly in the middle, so the area has a different
  ragged outline on each visit (`shapeMask`). Blocks show the steel texture at
  different zooms (`TILE_ZOOMS`; above 1 = smaller and denser), except two
  drawn as ink outlines, and each travels its own distance with the mouse. On
  wide screens two more blocks step out of the column to the right (an outline
  block beside the top row, a steel block beside the second-last row); the
  first intro paragraph, set larger, starts to the right of the top one. The
  right-hand strip is cut into squares too, emptied at random. All of this is
  in `gridPlan` and `layout` in `js/main.js`. (The engine still has a
  clay-relief style, `style: 2`, unused for now.)
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
  gives the black-and-white version on paper (`assets/img/paper.jpg`; the colour version uses it at 40%, pre-blended as `paper-40.jpg`), with
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
