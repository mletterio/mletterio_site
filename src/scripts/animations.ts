import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

const headerEl = document.querySelector<HTMLElement>('header');
const rootEl = document.documentElement;

// Publish the real header height as --header-h so hero padding and
// scroll-padding-top track the actual rendered height.
const syncHeaderHeight = () => {
	if (!headerEl) return;
	rootEl.style.setProperty('--header-h', `${headerEl.offsetHeight}px`);
};

// Returns the visible cap-top y-position of the first character in
// `wordmarkEl` (a Text container — typically `header h2 a`). The result is
// in viewport coordinates, so it can be compared directly to other
// `getBoundingClientRect()` values.
//
// Why this works: a Range's bounding rect spans the full font ascent-line
// to descent-line for the selected text — wider than the .logo-char DOM
// box, which is clipped to the line-box. Adding the cap-leading (`fbba -
// abba`, both from canvas measureText on the same font) takes us from the
// ascent-line top to the cap-top.
//
// Why not just paint "M" to canvas with `textBaseline: 'top'`: that
// reference is the EM-box top, which differs from the DOM line-box's
// ascent-line top by the half-leading (negative for ALT Systema, ~3px
// off at our sizes). Using Range pins to the actual rendered ascent line.
const measureCapTopY = (wordmarkEl: HTMLElement): number | null => {
	const cs = getComputedStyle(wordmarkEl);
	const size = parseFloat(cs.fontSize);
	if (!size) return null;
	// Find a single character to range over. SplitText wraps each char in
	// a div with a single text node child; falling back to the wordmark
	// itself works for the pre-split case.
	const charEl = wordmarkEl.querySelector<HTMLElement>('.logo-char') ?? wordmarkEl;
	const textNode = charEl.firstChild;
	if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;
	const range = document.createRange();
	range.selectNodeContents(charEl);
	const ascentLineTop = range.getBoundingClientRect().top;
	if (!Number.isFinite(ascentLineTop)) return null;
	// Pull cap-leading from canvas font metrics. measureText is reliable
	// for fbba/abba (font-bounding-box vs actual-bounding-box of "M");
	// only its `textBaseline: 'top'` rendering reference is misleading.
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
	const m = ctx.measureText('M');
	const capLeading = m.fontBoundingBoxAscent - m.actualBoundingBoxAscent;
	return ascentLineTop + capLeading;
};

// Computes the exact `.nav-links` padding-top required to land the ledge
// (top edge of `.nav-links`, where the `::before` lives) on the visible
// cap-top of the wordmark, then publishes it as `--ledge-offset` on :root.
//
// Structural derivation: the ledge sits at `nav-links.top`, which is
// `link.top - padding-top`. We want that y-coordinate to equal the
// rendered cap-top of the wordmark:
//
//     padding-top = link.top - capTopY(wordmark)
//
// where capTopY uses Range + font metrics to locate the actual rendered
// "M" cap-top (see measureCapTopY for why canvas paint alone isn't
// enough).
//
// Only applies in the desktop row layout. Below 1201px the nav stacks
// (column layout), the wordmark is above the links, and this geometry
// doesn't hold — the ledge there acts as a wordmark/links separator
// rather than a cap-top liner. We clear the var so the CSS fallback
// (`0.4em`) applies in those layouts.
const isDesktopRowLayout = () => window.matchMedia('(min-width: 1201px)').matches;

const syncLedgeOffset = () => {
	if (!isDesktopRowLayout()) {
		rootEl.style.removeProperty('--ledge-offset');
		return;
	}
	const wordmark = headerEl?.querySelector<HTMLElement>('h2 a');
	const navLinksEl = headerEl?.querySelector<HTMLElement>('.nav-links');
	const linkEl = navLinksEl?.querySelector<HTMLElement>('a');
	if (!wordmark || !navLinksEl || !linkEl) return;
	const linkFontSize = parseFloat(getComputedStyle(linkEl).fontSize);
	if (!linkFontSize) return;

	// Why iterate: when padding-top changes, the wordmark's y position
	// shifts too (flex baseline alignment couples nav-links and h2). A
	// single measurement based on the current padding is stale by the
	// time the new padding takes effect. Measure ledge-vs-capTop after
	// each application and converge when the diff is sub-pixel.
	const maxIterations = 6;
	const tolerance = 0.5;
	for (let i = 0; i < maxIterations; i++) {
		const capTopY = measureCapTopY(wordmark);
		if (capTopY === null) return;
		const ledgeTop = navLinksEl.getBoundingClientRect().top;
		const diff = ledgeTop - capTopY;
		if (Math.abs(diff) < tolerance) return;
		// Reducing padding-top moves the ledge DOWN. So if the ledge is
		// ABOVE the cap (diff < 0), reduce padding by |diff|.
		const currentRaw = getComputedStyle(navLinksEl).paddingTop;
		const current = parseFloat(currentRaw);
		const next = current + diff;
		if (next < 0 || next > linkFontSize * 4) return;
		rootEl.style.setProperty('--ledge-offset', `${next}px`);
		// Force layout flush so the next iteration reads the new state.
		void navLinksEl.offsetHeight;
	}
};

if (headerEl) {
	syncHeaderHeight();
	syncLedgeOffset();
	const ro = new ResizeObserver(() => {
		syncHeaderHeight();
		syncLedgeOffset();
		ScrollTrigger.refresh();
	});
	ro.observe(headerEl);
	window.addEventListener('orientationchange', () => {
		syncHeaderHeight();
		syncLedgeOffset();
	});
	// Fonts may swap in after first paint; remeasure once they're ready.
	document.fonts.ready.then(syncLedgeOffset);
}

// ScrollSmoother MUST be created before any ScrollTrigger.create() call so
// triggers measure against the smoothed scroller. Skipped under
// prefers-reduced-motion — the page falls back to native scroll.
const smoother = prefersReducedMotion
	? null
	: ScrollSmoother.create({
			wrapper: '#smooth-wrapper',
			content: '#smooth-content',
			smooth: 1.2,
			smoothTouch: 0.1,
			effects: true,
			normalizeScroll: true,
		});

document.fonts.ready.then(() => ScrollTrigger.refresh());

document.querySelectorAll<HTMLAnchorElement>('a[data-anchor]').forEach((a) => {
	a.addEventListener('click', (e) => {
		const href = a.getAttribute('href');
		if (!href || !href.startsWith('#')) return;
		e.preventDefault();
		if (smoother) {
			smoother.scrollTo(href, true, 'top top');
			return;
		}
		const target = document.querySelector(href);
		if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});
});

const heroNameEl = document.querySelector<HTMLElement>('h1.hero__name');
const taglineEl = document.querySelector<HTMLElement>('.hero__tagline');
const logoEl = headerEl?.querySelector<HTMLElement>('h2 a') ?? null;
const navItems = Array.from(headerEl?.querySelectorAll<HTMLElement>('.nav-links a') ?? []);
const navLinksEl = headerEl?.querySelector<HTMLElement>('.nav-links') ?? null;

const runIntro = (logoChars: Element[], heroChars: Element[]) => {
	// Pre-hide intro targets synchronously so there's no flash before the
	// timeline's playhead reaches each tween (`.from()` inside a paused
	// timeline has immediateRender:false by default).
	if (logoChars.length) gsap.set(logoChars, { yPercent: 110, opacity: 0 });
	if (navItems.length) gsap.set(navItems, { y: 12, opacity: 0 });
	if (heroChars.length) gsap.set(heroChars, { yPercent: 110, opacity: 0 });
	if (taglineEl) gsap.set(taglineEl, { y: 16, opacity: 0 });
	if (navLinksEl) gsap.set(navLinksEl, { '--ledge-wipe': '100%' });

	const master = gsap.timeline({
		defaults: { ease: 'expo.out', duration: 0.7 },
		delay: 0.1,
	});

	master
		.addLabel('open')
		// Logo chars rise + ledge wipes in — concurrent. The ledge "wipes
		// with" the wordmark per design intent.
		.to(logoChars, {
			yPercent: 0,
			opacity: 1,
			stagger: 0.035,
			duration: 0.75,
		}, 'open')
		.to(navLinksEl, {
			'--ledge-wipe': '0%',
			duration: 0.55,
			ease: 'power2.inOut',
		}, 'open')
		// Nav links emerge AFTER ledge + wordmark finish — sequential, no
		// negative overlap. Reads as: ledge "wipes" the links into being.
		.addLabel('nav', '>')
		.to(navItems, {
			y: 0,
			opacity: 1,
			stagger: 0.06,
			duration: 0.55,
			ease: 'power3.out',
		}, 'nav')
		.addLabel('hero', 'nav-=0.1')
		.to(heroChars, {
			yPercent: 0,
			opacity: 1,
			stagger: 0.04,
			duration: 0.9,
		}, 'hero')
		.to(taglineEl, {
			y: 0,
			opacity: 1,
			duration: 0.7,
			ease: 'power3.out',
		}, 'hero+=0.3');

	// Mid-page reload: skip the intro so it doesn't play below the fold.
	const scrolled = smoother ? smoother.scrollTop() : window.scrollY;
	if (scrolled > 10) master.progress(1);

	return master;
};

const runCollapse = (master: gsap.core.Timeline, logoChars: Element[]) => {
	// matchMedia auto-reverts ScrollTriggers + tweens when conditions stop
	// matching, so resizing across breakpoints rebuilds the collapse
	// without leaking listeners or stale tweens.
	const mm = gsap.matchMedia();
	mm.add(
		{
			isPhone: '(max-width: 640px)',
			isTablet: '(min-width: 641px) and (max-width: 1200px)',
			isDesktop: '(min-width: 1201px)',
		},
		(ctx) => {
			const { isPhone, isDesktop } = ctx.conditions as {
				isPhone: boolean;
				isTablet: boolean;
				isDesktop: boolean;
			};
			const rotMax = isPhone ? 10 : 18;

			// Inside a scrubbed ScrollTrigger, tween durations act as
			// PROPORTIONS of total scroll distance, not seconds. So the
			// 0.35 / 0.55 below describe how the scroll budget is split.
			const collapse = gsap.timeline({
				defaults: { ease: 'power2.inOut' },
			});

			// 1. Nav links disappear into the ledge first.
			//    Desktop: slide up; overflow:hidden on .nav-links clips
			//    them, so no opacity tween — the wipe stays the focal
			//    action. yPercent is relative to the link's own height,
			//    so the link has to travel its-top → ledge-line, which
			//    is roughly the .nav-links padding-top plus its own
			//    height. -300% gives margin so the links are fully
			//    above the ledge before the wipe starts.
			//    Phone: links don't move, so fade is the only way to
			//    clear them.
			if (navItems.length) {
				if (isDesktop) {
					collapse.to(navItems, {
						yPercent: -300,
						duration: 0.35,
						stagger: 0.015,
					}, 0);
				} else {
					collapse.to(navItems, {
						opacity: 0,
						duration: 0.35,
						stagger: 0.015,
					}, 0);
				}
			}

			// 2. Ledge wipes out + wordmark flies up — concurrent with
			//    each other, sequential after nav items.
			if (navLinksEl) {
				collapse.to(navLinksEl, {
					'--ledge-wipe': '100%',
					duration: 0.3,
				}, 0.35);
			}
			if (logoChars.length) {
				collapse.to(logoChars, {
					yPercent: -600,
					rotation: () => gsap.utils.random(-rotMax, rotMax),
					transformOrigin: '50% 100%',
					stagger: { each: 0.03, from: 'end' },
					duration: 0.55,
					ease: 'power2.in',
				}, 0.35);
			}

			const trigger = ScrollTrigger.create({
				trigger: 'main',
				// `top+=X top` (not `top top+=X`) — main starts at viewport
				// top (header is fixed), so `top top+=X` would read as
				// already past start on load and fire immediately.
				start: () => `top+=${(headerEl?.offsetHeight ?? 88) * 0.3} top`,
				end: () => `+=${(headerEl?.offsetHeight ?? 88) * 0.8}`,
				// Numeric scrub layered over the smoother's own ease — feels
				// inertial without being mushy. Lower on touch where the
				// pin/scrub combo is more sensitive to stutter.
				scrub: isPhone ? 0.3 : 0.6,
				animation: collapse,
				invalidateOnRefresh: true,
				onUpdate: (self) => {
					// If a scroll lands during the intro, jump the intro to
					// the end so it doesn't fight the collapse on shared
					// targets (logoChars, navLinksEl).
					if (self.progress > 0 && master.isActive()) master.progress(1);
				},
			});

			return () => {
				trigger.kill();
				collapse.kill();
			};
		}
	);
};

const runRevealTriggers = () => {
	gsap.utils.toArray<HTMLElement>('.section').forEach((section) => {
		const label = section.querySelector<HTMLElement>('.section__label');
		const heading = section.querySelector<HTMLElement>('.section__heading');
		const rest = section.querySelectorAll<HTMLElement>(
			'.section__body, .section__links'
		);

		const tl = gsap.timeline({
			scrollTrigger: { trigger: section, start: 'top 86%', once: true },
			defaults: { ease: 'power3.out' },
		});

		if (label) {
			tl.from(label, {
				clipPath: 'inset(0 100% 0 0)',
				duration: 0.6,
				ease: 'power3.inOut',
			});
		}
		if (heading) {
			tl.from(heading, { y: 36, opacity: 0, duration: 0.75 }, '-=0.3');
		}
		if (rest.length) {
			tl.from(rest, {
				y: 22,
				opacity: 0,
				duration: 0.65,
				stagger: 0.09,
			}, '-=0.4');
		}
	});

	const footer = document.querySelector<HTMLElement>('.footer');
	if (!footer) return;

	const wordmark = footer.querySelector<HTMLElement>('[data-footer-reveal="wordmark"]');
	const dot = footer.querySelector<HTMLElement>('[data-footer-reveal="dot"]');
	const identity = footer.querySelector<HTMLElement>('[data-footer-reveal="identity"]');
	const meta = footer.querySelector<HTMLElement>('[data-footer-reveal="meta"]');

	const tl = gsap.timeline({
		scrollTrigger: { trigger: footer, start: 'top 88%', once: true },
		defaults: { ease: 'power3.out', duration: 0.7 },
	});
	if (wordmark) tl.from(wordmark, { y: 14, opacity: 0 });
	if (dot) {
		tl.from(dot, {
			scale: 0,
			duration: 0.55,
			ease: 'back.out(1.8)',
		}, '-=0.25');
	}
	if (identity) tl.from(identity, { y: 14, opacity: 0, duration: 0.65 }, '-=0.35');
	if (meta) tl.from(meta, { y: 14, opacity: 0, duration: 0.65 }, '-=0.35');
};

const runCursorTrail = () => {
	const items = Array.from(document.querySelectorAll<HTMLImageElement>('.trail__item'));
	const hero = document.querySelector<HTMLElement>('.hero');
	if (items.length === 0 || !hero) return;

	gsap.set(items, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });

	let cursor = 0;
	let last = 0;
	const minInterval = 160;
	const minDistance = 160;
	let lastX = -9999;
	let lastY = -9999;

	const spawn = (x: number, y: number) => {
		const el = items[cursor % items.length];
		cursor++;
		const lowRes = el.dataset.lowRes === 'true';
		const baseScale = lowRes
			? gsap.utils.random(0.45, 0.7)
			: gsap.utils.random(0.8, 1.15);
		const rotation = gsap.utils.random(-8, 8);

		gsap.killTweensOf(el);
		gsap.set(el, { x, y, rotation, scale: baseScale * 0.85, opacity: 0 });
		gsap
			.timeline()
			.to(el, { opacity: 1, scale: baseScale, duration: 0.25, ease: 'power2.out' })
			.to(el, { opacity: 0, scale: baseScale * 0.9, duration: 0.9, ease: 'power2.in' }, '+=0.35');
	};

	window.addEventListener(
		'pointermove',
		(e) => {
			const rect = hero.getBoundingClientRect();
			const inHero =
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom &&
				e.clientX >= rect.left &&
				e.clientX <= rect.right;
			if (!inHero) return;

			const now = performance.now();
			const dx = e.clientX - lastX;
			const dy = e.clientY - lastY;
			if (now - last < minInterval) return;
			if (dx * dx + dy * dy < minDistance * minDistance) return;
			last = now;
			lastX = e.clientX;
			lastY = e.clientY;
			spawn(e.clientX, e.clientY);
		},
		{ passive: true }
	);
};

if (prefersReducedMotion) {
	if (navLinksEl) navLinksEl.style.setProperty('--ledge-wipe', '0%');
} else {
	// Wait for fonts before splitting — char widths/positions are unstable
	// until the web font is rendered, which would otherwise cause the
	// intro to animate against pre-fallback layout.
	document.fonts.ready.then(() => {
		// SplitText replaces the hand-rolled splitChars/splitLogo helpers.
		// Logo uses words+chars so each word gets its own clipping box;
		// chars sliding from below don't bleed across lines on mobile.
		const heroSplit = heroNameEl
			? SplitText.create(heroNameEl, { type: 'chars', charsClass: 'char' })
			: null;
		const logoSplit = logoEl
			? SplitText.create(logoEl, {
					type: 'words,chars',
					wordsClass: 'logo-word',
					charsClass: 'logo-char',
				})
			: null;

		const heroChars = heroSplit?.chars ?? [];
		const logoChars = logoSplit?.chars ?? [];

		const master = runIntro(logoChars, heroChars);
		runCollapse(master, logoChars);
		runRevealTriggers();
	});

	if (!isCoarsePointer) runCursorTrail();
}
