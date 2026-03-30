# Editorial Redesign Plan

## Working Concept

Build the site as a curated technical index rather than a portfolio landing page.

The homepage should feel like:

- selected systems
- engineering notebook
- production-minded AI / ML work
- research translated into reliable software
- calm technical judgment

The site should not feel like:

- a student portfolio
- a startup homepage
- an AI-glow template
- a centered hero with a slogan and CTA stack

## What Needs To Change From The Current Site

The current build conflicts with the new brief in several structural ways:

- the homepage is hero-first instead of work-first
- the visual language relies on aurora gradients, glass panels, glow, and CTA styling
- the nav is crowded and anchored to a generic portfolio model
- projects are presented as image-heavy cards instead of system case studies
- the homepage includes low-signal sections like `Outside Work`, a large skills wall, and extra resume-style sections
- the contact form adds friction without improving credibility
- the notes identity is mixed: one strong engineering note, two job-search-oriented notes

There is also technical debt that makes a rewrite more sensible than an incremental polish:

- [style.css](C:/Users/vamsi/OneDrive/Documents/VirginiaTech/Personal/personal%20website/css/style.css#L1) contains duplicated aurora blocks and a malformed `@keyframes` section
- [index.html](C:/Users/vamsi/OneDrive/Documents/VirginiaTech/Personal/personal%20website/index.html#L45) is a very large single file carrying multiple design systems at once
- [scripts.test.js](C:/Users/vamsi/OneDrive/Documents/VirginiaTech/Personal/personal%20website/tests/scripts.test.js#L15) references `../js/scripts`, but the active file is `js/main.js`

Recommendation: treat this as a replace-not-refine redesign.

## Content Direction

The homepage should lead with applied systems work, not self-promotion.

Core signals to amplify:

- applied AI / ML engineering
- agent runtimes and orchestration
- retrieval and data workflows
- ML infrastructure and deployment
- evaluation, observability, and reliability
- research-to-engineering translation

Signals to de-emphasize or move off the homepage:

- awards, vanity metrics, stars, testimonials
- hobbies
- long education blocks
- generic skill inventories
- non-engineering writing as primary proof of thinking

## Target Information Architecture

Top navigation:

- Work
- Notes
- Experience
- Resume
- Contact

Homepage flow:

1. Quiet intro block
2. Featured work
3. Notes
4. Experience snapshot
5. Working areas
6. Contact / footer

Supporting pages:

- `index.html`: curated homepage / systems index
- `blog.html` or renamed `notes.html`: engineering notes page
- dedicated case-study pages only if needed later

Recommendation: keep Work and Experience as homepage anchors, keep Notes as its own page, and keep Resume as a direct PDF link.

## Homepage Structure

### 1. Header

Minimal fixed header with understated typography and no theme toy.

Rules:

- no About nav item
- no Skills nav item
- no dark-mode toggle in the main nav for V1
- no filled CTA button in the header

### 2. Opening Block

The opening block should be left-aligned and compact, not slogan-driven.

Content:

- name
- 2 to 4 line technical intro
- one current-focus strip
- one compact metadata line

Recommended content shape:

- name: `Krishna Vamsi Dhulipalla`
- intro: `AI / ML engineer focused on agent runtimes, retrieval systems, and production infrastructure. I build systems that turn model behavior into something inspectable, measurable, and reliable in use.`
- current focus: `Current focus: orchestration patterns for tool-using agents, retrieval reliability, and evaluation loops for production systems.`
- metadata line: `Based in the U.S. | Applied AI / ML Systems | Infrastructure, retrieval, evaluation`

### 3. Featured Work

This is the primary section of the homepage.

Presentation model:

- text-led case-study rows, not equal-height cards
- each item gets a structured layout with two columns on desktop
- left column: title, context, category, role
- right column: 3 to 5 lines describing what mattered and what was built
- links sit inline and low-key: `case study`, `repo`, `notes`

Each featured item should answer:

- what it is
- why it mattered
- what you built
- what system area it belongs to

Recommended homepage featured order:

1. `CoreLink AI`
2. `Clinical Pre-Rounding Assistant`
3. `Agent K8s Sandbox`
4. `Internal Data Agents`

Recommended archive / secondary items:

- `Autonomous UI Agent`
- `Proxy TuNER`
- `DNA Sequence Classifier`
- `PulseMap`
- `IntelliMeet`

Reasoning:

- `CoreLink AI` is the strongest current flagship because it presents modular reasoning, tool-constrained execution, and production-system framing
- `Clinical Pre-Rounding Assistant` shows real applied AI reliability concerns
- `Agent K8s Sandbox` proves infra and sandboxing depth
- `Internal Data Agents` shows direct enterprise automation and operational value

### 4. Notes

Treat writing as proof of technical judgment, not content marketing.

Homepage notes block:

- 2 to 3 featured engineering notes
- each note should surface the engineering question, not just the title
- notes should look like notebook entries or field reports, not blog cards

Important content recommendation:

- keep `Why Your Vision Model Is Lying to You` prominent
- move the two job-search / hiring posts out of the homepage notes preview
- keep them in the archive if you want, but they should not define the site identity

Future note themes to prioritize:

- agent runtimes
- retrieval failure modes
- evaluation and observability
- deployment tradeoffs
- research-to-production lessons

### 5. Experience

This section should be compact and clean.

Use:

- role
- organization
- date range
- 1 short summary
- optional 2 bullets for the current role only

Recommendation:

- keep three roles visible on the homepage
- push older roles, education, and publications to the resume PDF or a later secondary page

### 6. Working Areas

No skill wall.

Use restrained grouped lists:

- Agent Systems
- Retrieval / Data Workflows
- ML Infrastructure
- Cloud / Deployment
- Scientific / Healthcare AI

Each group should have 3 to 5 short capability lines with no icon soup.

### 7. Contact

Keep this minimal.

Recommendation:

- remove the form
- use direct links only: email, GitHub, LinkedIn, resume

## Visual System

### Overall Direction

Light-first, paper-like, editorial, and structured.

This should feel closer to a technical journal or selected-work index than to a product site.

### Layout

- strong editorial grid
- asymmetric but disciplined columns
- wide margins and generous whitespace
- section markers that feel like index labels or print annotations

### Typography

Use typography as the main source of identity.

Recommended stack:

- serif accent: `Spectral` or `Source Serif 4` for section titles and selective emphasis
- sans body / UI: `IBM Plex Sans` or `Instrument Sans`
- mono utility: `IBM Plex Mono` for labels, dates, categories, and metadata

Use the serif sparingly. The site should still read as an engineer's site, not a literary blog.

### Color

Recommended palette direction:

- paper: warm off-white
- ink: near-black
- muted graphite for secondary text
- restrained risograph-style accent inks: teal, ultramarine, and rust

Example working palette:

- paper: `#f4efe6`
- ink: `#141414`
- graphite: `#5f5a54`
- teal ink: `#1b7a71`
- blue ink: `#4e67b6`
- rust ink: `#b05946`

### Texture and Effects

Allowed:

- subtle paper grain
- fine rule lines
- sparse offset shadows on small labels
- restrained chromatic misregistration on tiny markers, hovers, or dividers

Not allowed:

- glass panels
- blurred glow fields
- big gradients
- neon edges
- dashboard-style animation

### Motion

Use almost none.

Acceptable motion:

- subtle row hover shift
- underline / rule movement
- tiny chromatic offset on links or labels
- minimal section reveal only if it stays nearly static

Recommendation: remove AOS and Lottie from the redesign unless a single element clearly benefits from them.

## Implementation Strategy

### Structural Strategy

Recommendation:

- rewrite `index.html` around semantic sections and a simpler DOM
- keep CSS custom properties in one clean stylesheet
- reduce dependency on Tailwind CDN utility styling for the core visual identity
- keep JS minimal: mobile nav, optional anchor highlighting, optional theme handling if retained

If maintainability is a priority, move content into Jekyll data files later:

- `_data/work.yml`
- `_data/experience.yml`
- `_data/areas.yml`

That is optional for phase 1. The first goal is a coherent redesign.

### Phase 1. Content Model And Wireframe

- confirm featured projects
- trim homepage sections
- rewrite intro copy
- decide what content stays on the homepage vs moves to resume / archive

### Phase 2. Homepage Rebuild

- new header
- new intro block
- new featured work system
- new notes preview
- compact experience
- restrained working areas
- minimal contact footer

### Phase 3. Notes Page Rebuild

- redesign `blog.html` into a notes index that matches the homepage system
- make engineering notes primary
- visually separate non-core writing if retained

### Phase 4. Polish And QA

- mobile layout tuning
- accessibility pass
- contrast audit
- keyboard navigation
- content consistency
- remove stale code, classes, and unused assets

## Proposed Defaults If You Want Me To Proceed Without Waiting

- light-first only for V1
- no personal photo
- no contact form
- no hobbies section
- no education / publications on the homepage
- four featured projects on the homepage
- job-search notes stay in the archive, not the main homepage notes preview
- plain, text-led work rows with optional small diagram thumbnails only where they add meaning

## Clarifications Needed Before Implementation

1. Do you want the redesign to stay light-first only, or do you want a dark mode preserved?

2. Confirm the homepage featured set.
   Default recommendation: `CoreLink AI`, `Clinical Pre-Rounding Assistant`, `Agent K8s Sandbox`, `Internal Data Agents`.

3. If you have any visual references, send 2 to 3 sites or screenshots.
   I do not need them, but they will help tune the typography and page density.
