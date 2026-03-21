# mletterio.github.io

Personal site for Michael Letterio — a blog and photography gallery built with [Astro](https://astro.build).

**Live site:** https://mletterio.github.io

---

## Stack

- [Astro](https://astro.build) — static site generator
- TypeScript
- Custom CSS (Bear Blog-inspired, no frameworks)
- GitHub Actions — auto-deploys `main` to GitHub Pages

---

## Project structure

```
src/
├── assets/
│   └── photos/          # Gallery images (processed by Astro's image pipeline)
├── components/
│   ├── BaseHead.astro   # Global <head> — SEO, OG tags, fonts
│   ├── Footer.astro
│   ├── FormattedDate.astro
│   ├── Header.astro     # Site navigation
│   └── HeaderLink.astro
├── content/
│   ├── blog/            # Blog posts (.md or .mdx)
│   ├── photos/          # Photo metadata (.json) for the gallery
│   └── config.ts        # Content collection schemas
├── layouts/
│   └── BlogPost.astro   # Layout for individual blog posts
├── pages/
│   ├── index.astro      # Homepage
│   ├── about.astro      # About page
│   ├── gallery.astro    # Photo gallery
│   ├── rss.xml.js       # RSS feed
│   └── blog/
│       ├── index.astro  # Blog post listing
│       └── [...slug].astro
└── styles/
    └── global.css
```

---

## Adding a blog post

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: 'Post title'
description: 'A short summary shown in the post list.'
pubDate: '2026-01-15'
---

Post content goes here.
```

The post will automatically appear in the blog listing and RSS feed.

---

## Adding a photo to the gallery

1. Add the image file to `src/assets/photos/` (JPEG or PNG recommended).

2. Create a matching `.json` file in `src/content/photos/`:

```json
{
  "title": "Photo title",
  "date": "2026-01-15",
  "location": "Boston, MA",
  "description": "Optional caption.",
  "image": "../../assets/photos/your-photo.jpg"
}
```

Photos are sorted newest-first and displayed in a responsive grid. Clicking a photo opens the full-size version in a new tab.

---

## Local development

```sh
npm install       # Install dependencies
npm run dev       # Start dev server at localhost:4321
npm run build     # Build for production
npm run preview   # Preview production build locally
```

---

## Test plan

See [TEST_PLAN.md](./TEST_PLAN.md) for the full test checklist.
