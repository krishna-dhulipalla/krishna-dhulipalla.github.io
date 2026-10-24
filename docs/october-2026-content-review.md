# Portfolio content update and functional review

Reviewed October 23, 2026. Changes are local and have not been pushed or published.

## Content

- Updated the introduction, current focus, technical stack, and experience using the supplied resume.
- Updated CoreLink AI, Rounds, and AgentTask Operator using their current public README files.
- Added the supplied PDF at `assets/KrishnaDhulipalla.pdf`, with download links on the homepage and resume page.
- Expanded the resume page with the internship, education year, selected projects, publications, and certifications.
- Used the resume's Tabner metrics in the experience sections. These are user-supplied results, not independently reproduced measurements.
- Kept project descriptions focused on documented capabilities. Did not promote the resume's benchmark percentages into the website without their evaluation context.
- Retained the existing typography, colors, illustrated portrait, glitch effects, hover behavior, and light/dark theme.

## Fixes

- Centralized contact links on the email in `_config.yml`.
- Fixed narrow-screen horizontal overflow by calculating gutters from the available container width.
- Measured the sticky header for anchor offsets, including after the mobile menu closes.
- Added Escape dismissal, focus restoration, and outside-click dismissal for the mobile menu.
- Prevented stale speech cancellation callbacks and repeated restart timers from interfering with new article playback. Reset audio state when leaving the page.
- Kept decorative glitch text out of accessible names without changing the visual effect.
- Restored the missing CoreLink article diagram from the project's architecture SVG; used the existing PNG portrait for the article's social preview.
- Excluded tests, internal planning documents, and inactive API source from the static site output.
- Scoped Jest discovery to source tests, avoiding duplicate execution from `_site`, and declared its jsdom environment dependency.
- Generated legacy sitemap formats from current posts and advertised the canonical Jekyll sitemap in robots.txt.
- Updated the IntelliMeet URL to the public repository's current name.

## Validation

- `npm test -- --runInBand`: 10 tests passed.
- `bundle exec jekyll build --quiet`: succeeded. Minima's unused generated Sass still emits dependency deprecation warnings.
- Checked 12 generated HTML pages and 290 internal link references, including fragment targets, with no unresolved references or duplicate IDs.
- Parsed both XML sitemaps and the Atom feed; confirmed sitemap targets exist and excluded development files are absent from `_site`.
- Chromium checks: home, resume, notes, and 404 pages at 375, 768, 920, 1024, and 1440 pixels, without horizontal overflow or missing images.
- Verified theme persistence, mobile navigation and sticky-header anchors, accessible heading names, article control presence, and an actual PDF download.
- No browser JavaScript exceptions during those checks. Speech cancellation behavior was verified with mocked speech synthesis; audible playback and the operating-system share sheet were not end-to-end tested.
- Screenshots and local verification helpers are in ignored `output/playwright/`.

## Suggestions

1. Add one real interface screenshot or a short walkthrough to each featured project, showing the user workflow and a concrete engineering tradeoff.
2. Optimize the 1.88 MB portrait into a modern format while keeping a PNG social-preview fallback and preserving the matching photo-effect layers.
3. Run the build, regression tests, and generated-site link audit automatically before publishing.

The source `STYLEGUIDE.md` describes an older design. It was not used to restyle the current site; reconcile it with the live design before future visual work.
