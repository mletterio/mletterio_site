# Test Plan

Tests for the mletterio.github.io personal blog and gallery site.

---

## 1. Build

| Test | Command | Expected |
|------|---------|----------|
| Production build succeeds | `npm run build` | Exits 0, no errors |
| TypeScript check passes | `npx astro check` | No type errors |
| No Tailwind class warnings | `npm run build` | No unresolved class warnings |

---

## 2. Navigation

Run `npm run dev` and verify in a browser at `localhost:4321`.

| Test | Steps | Expected |
|------|-------|----------|
| Site title links to home | Click "MICHAEL LETTERIO" in header | Navigates to `/` |
| Gallery nav link | Click "Gallery" in header | Navigates to `/gallery/` |
| Writing nav link | Click "Writing" in header | Navigates to `/blog/` |
| About nav link | Click "About" in header | Navigates to `/about/` |
| LinkedIn link | Click "LinkedIn →" in header | Opens `linkedin.com/in/michael-letterio` in new tab |
| GitHub link | Click "GitHub →" in header | Opens `github.com/mletterio` in new tab |
| Active link styling | Visit each page | Current page link shows underline |

---

## 3. Homepage

| Test | Expected |
|------|----------|
| Loads without error | Page renders, no console errors |
| No "under construction" text | Zero instances of that phrase |
| No lorem ipsum text | Zero instances of "Lorem ipsum" |
| "Gallery →" link works | Navigates to `/gallery/` |
| "Writing →" link works | Navigates to `/blog/` |
| "About" link works | Navigates to `/about/` |

---

## 4. Blog

| Test | Expected |
|------|----------|
| Blog index loads | Page renders at `/blog/` |
| "Hello, world" post appears in listing | Post title visible with date |
| Clicking post navigates to it | Route `/blog/hello-world/` renders |
| Post content renders correctly | Markdown content displayed |
| No placeholder hero images | No broken `<img>` tags for removed images |
| RSS feed valid | `/rss.xml` returns valid XML with one entry |

---

## 5. Gallery

| Test | Expected |
|------|----------|
| Gallery page loads | Page renders at `/gallery/` |
| No Tailwind classes in output HTML | No `class="p-8"` or similar utility classes |
| Empty state displays | "Photos coming soon." shown when `src/content/photos/` has no JSON files |
| Grid renders when photos added | Adding a test photo JSON + image shows it in the grid |
| Photo links open in new tab | `target="_blank"` present on photo anchors |
| Responsive grid | At 720px width, grid adjusts to narrower columns |

---

## 6. About

| Test | Expected |
|------|----------|
| About page loads | Page renders at `/about/` |
| No lorem ipsum text | Zero instances of "Lorem ipsum" |
| Contact links present | LinkedIn and GitHub links visible |
| Links open in new tab | `target="_blank"` on contact links |

---

## 7. Content collections

| Test | Command | Expected |
|------|---------|----------|
| Blog collection builds | `npm run build` | `hello-world.md` included in output |
| Photos collection (empty) | `npm run build` | No errors; gallery shows empty state |
| Photos collection (with entry) | Add test JSON + image, run `npm run build` | Gallery renders photo |

---

## 8. SEO & metadata

| Test | Expected |
|------|----------|
| Page title — home | `<title>MICHAEL LETTERIO</title>` |
| Page title — blog | `<title>Writing — MICHAEL LETTERIO</title>` |
| Page title — gallery | `<title>Gallery — MICHAEL LETTERIO</title>` |
| Page title — about | `<title>About — MICHAEL LETTERIO</title>` |
| Meta description set | `<meta name="description">` present on all pages |
| Canonical URL present | `<link rel="canonical">` present on all pages |
| OG tags present | `og:title`, `og:description`, `og:url` on all pages |
| Sitemap generated | `sitemap-index.xml` exists in build output |
| Favicon present | `/favicon.svg` loads |

---

## 9. Responsive design

| Test | Viewport | Expected |
|------|----------|----------|
| Header stacks vertically | ≤ 870px | Nav links wrap below site title |
| Blog list readable | ≤ 640px | Posts stack, text legible |
| Gallery grid narrows | ≤ 720px | Grid uses narrower `minmax(240px, 1fr)` |
| Footer readable | mobile | Text centered and legible |

---

## 10. No broken references

| Test | Expected |
|------|----------|
| No references to `blog-placeholder-*.jpg` | Grep finds zero matches in `src/` |
| No references to `albums` collection | `getCollection('albums')` not called anywhere |
| No Tailwind in gallery page source | `gallery.astro` contains no `class="p-8"` or similar |
| No lorem ipsum in any page | Grep for "Lorem ipsum" returns no results in `src/` |
