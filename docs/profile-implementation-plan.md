# Portfolio Enhancements — Implementation Plan (Agent‑Vibe, Professional)

**Scope:** Implement features 1, 2, 3, 4, 5, 6, 7, 8, and 10 on the existing portfolio. Maintain a clean, recruiter‑friendly aesthetic with subtle, performant animations. All features must be testable directly in the browser with local prototypes before integration.

**Non‑Goals:** Playful gimmicks, heavy 3D scenes, distracting color palettes, or experimental shaders that compromise readability, accessibility, or performance.

---

## Global Principles

- **Design tone:** Minimal, monochrome‑first, accent color sparingly. Motion is subtle and purposeful.
- **Performance:** Prefer vector/SVG, Lottie, and lightweight Three.js scenes. Always ship an accessible static fallback.
- **Accessibility:** Respect `prefers-reduced-motion`. Provide text equivalents. Keyboard and screen‑reader friendly.
- **Safety:** Each feature ships behind a small feature toggle to allow quick disable if issues occur.
- **Testability:** Every feature has a self‑contained browser demo page under `/lab/` for local validation.

**Suggested Libraries**

- **Animation:** GSAP + ScrollTrigger, Lottie (bodymovin JSON), CSS transitions
- **3D:** Three.js with react‑three‑fiber, drei helpers (only where needed)
- **Diagrams:** SVG + lightweight path animations; Mermaid for static diagrams if needed
- **Images (10):** Start with “hand‑drawn” look using Banana Pro sketches exported to PNG/SVG, then animate SVG strokes minimally

**Folder Conventions**

- `src/features/<feature-name>/` for integration components
- `public/lab/<feature-name>/` for self‑contained demo HTMLs
- `public/assets/<feature-name>/` for JSON/SVG/PNG
- `src/flags.ts` simple feature flags exported constants
- `src/styles/animations.css` global motion tokens and easing

---

## Feature 1. AI System Flow Animation (Hero)

**Goal:** Communicate your typical AI workflow at a glance: User → LLM Agent → Tools → SQL/API → Response.

**User Story:** As a recruiter, I should understand your value within 3 seconds of landing on the page.

**UX Spec:**

- Thin‑line monochrome animation (SVG or Lottie) centered in hero.
- On first view, a single pass of the flow animates in 2–3 seconds.
- Respect `prefers-reduced-motion`: switch to static diagram.

**Tech Choices:**

- Lottie JSON via bodymovin (preferred) or hand‑animated SVG paths.
- One lightweight intersection observer to trigger once per session.

**Integration Steps:**

1. Create JSON or SVG asset under `public/assets/flow-hero/`.
2. Add `HeroFlow.tsx` in `src/features/hero-flow/` that renders Lottie/SVG with reduced‑motion fallback.
3. Gate with `HERO_FLOW_ENABLED` in `src/flags.ts` and add to Hero section.

**Tests (Browser):**

- `/lab/hero-flow.html` demonstrates autoplay, reduced‑motion, and pause/resume.
- Verify mobile scaling and no CLS (cumulative layout shift).
- Lighthouse Performance ≥ 95 on the lab page.

---

## Feature 2. Interactive Skill Graph (3D, Subtle)

**Goal:** Show skill clusters and relationships without clutter.

**User Story:** As a manager, I can see clusters (LLMs/Agents, Infra, Cloud, Genomics) and hover to view concise usage notes.

**UX Spec:**

- Slow rotation at rest, hover highlights node and displays a compact tooltip with “How used”.
- Provide a non‑3D fallback list for reduced‑motion or low‑power devices.

**Tech Choices:**

- Three.js with `react-three-fiber` and minimal `drei` helpers.
- Node data as JSON with categories and links.

**Integration Steps:**

1. Define node/edge JSON under `public/assets/skill-graph/skills.json`.
2. Build `SkillGraph3D.tsx` rendering spheres and soft lines, very low poly.
3. Add `prefers-reduced-motion` and `SSR` fallback to a grid list. Feature flag `SKILL_GRAPH_3D_ENABLED`.

**Tests (Browser):**

- `/lab/skill-graph.html` with JSON switcher for stress test.
- GPU load check (Chrome Task Manager), FPS smoothness, CPU < 10% idle.
- Keyboard focus sequence cycles through nodes in fallback mode.

---

## Feature 3. Model Deployment Timeline (Horizontal 3D Scroll)

**Goal:** Showcase your pipeline maturity from experiment to monitor in a visual, horizontal timeline.

**User Story:** As a recruiter, I see your end‑to‑end ML lifecycle immediately.

**UX Spec:**

- Sections: Experiment, Fine‑tune, Evaluate, Containerize, Deploy, Monitor.
- Subtle parallax and GSAP ScrollTrigger to reveal captions.
- Reduced‑motion: single static graphic with captions.

**Tech Choices:**

- GSAP + ScrollTrigger; optionally minimal Three.js background planes for depth.

**Integration Steps:**

1. Create SVG panels for each stage `public/assets/timeline/*.svg`.
2. `DeploymentTimeline.tsx` orchestrates scroll‑based reveals behind `TIMELINE_ENABLED`.
3. Ensure content is still readable when motion is disabled.

**Tests (Browser):**

- `/lab/deployment-timeline.html` with sections and scroll snapping.
- Test on mobile Safari and Chrome Android for smoothness.
- No horizontal scroll traps, all content reachable via keyboard.

---

## Feature 4. Agent Execution Visualizer (Project Cards)

**Goal:** Make multi‑agent orchestration clear for each project.

**User Story:** As a reviewer, I can see which agents are involved and how messages pass between them.

**UX Spec:**

- Minimal animated nodes labeled “Classifier, Verifier, Reporter”, lines pulse during sequence.
- On hover or click, play a short deterministic animation illustrating message passing.

**Tech Choices:**

- SVG paths + CSS animations or Lottie micro‑animations per project.
- State machine timing defined in a small JSON script per project.

**Integration Steps:**

1. Per project, add `public/assets/agents/<project>/flow.json` defining sequence.
2. `AgentVisualizer.tsx` renders nodes and animates edges; flag `AGENT_VIZ_ENABLED`.
3. Fallback is a static graph with numbered steps.

**Tests (Browser):**

- `/lab/agent-visualizer.html` with a sample sequence.
- Verify color contrast and alt text equivalents.
- CPU usage check during animation, ensure idle stops.

---

## Feature 5. AI Console Overlay (Toggle Panel)

**Goal:** Provide an “engineer’s window” to see sample traces and metrics without overwhelming non‑technical viewers.

**User Story:** As a technical recruiter, I can open a console panel to browse example LLM traces and metrics snapshots.

**UX Spec:**

- Top‑right icon toggles a side panel.
- Tabs: “Traces, Retrieval, Metrics” with short curated examples.
- Panel is non‑blocking and closes on `Esc` and overlay click.

**Tech Choices:**

- Vanilla HTML/CSS for panel; minimal JS for toggle; no frameworks required.
- Content from JSON stubs for easy edits.

**Integration Steps:**

1. `public/assets/console/*.json` sample data.
2. `AIConsole.tsx` renders tabs; guard with `AI_CONSOLE_ENABLED`.
3. Respect reduced‑motion, provide focus trap and ARIA roles.

**Tests (Browser):**

- `/lab/ai-console.html` panel open/close, tab switch, keyboard navigation.
- Screen reader labels verified.

---

## Feature 6. Before/After Metrics Micro‑Animations

**Goal:** Make quantified impact pop without clutter.

**User Story:** I can skim outcomes like “ETL runtime –25%” and see a quick visual reinforcing it.

**UX Spec:**

- Bars shrink/expand subtly on scroll into view.
- Each metric has a 1‑line caption and exact percent metric.

**Tech Choices:**

- CSS transforms with IntersectionObserver; no heavy chart libs.
- Reduced‑motion: static bars with numerals only.

**Integration Steps:**

1. Data file `public/assets/metrics/impact.json` with label, before, after, unit.
2. `ImpactMetrics.tsx` renders list → bars animate on enter; flag `IMPACT_METRICS_ENABLED`.
3. Ensure numbers are read by assistive tech.

**Tests (Browser):**

- `/lab/metrics.html` with multiple density variations.
- Confirm no layout shift and text remains crisp.

---

## Feature 7. Interactive DNA Sequence Ribbon (Genomics Section)

**Goal:** Visually tie AI to genomics work without loud visuals.

**User Story:** I see a subtle ribbon that reveals k‑mer tokens or confidence on hover.

**UX Spec:**

- Low‑contrast DNA helix or ribbon behind content.
- Hover reveals small tooltips for tokens/confidence; motion pauses on hover.

**Tech Choices:**

- SVG path with gentle keyframe motion; data overlays via absolute‑positioned labels.
- Reduced‑motion: static ribbon image.

**Integration Steps:**

1. `public/assets/dna-ribbon/*.svg` base ribbon; optional JSON for token markers.
2. `DnaRibbon.tsx` renders background and overlays; flag `DNA_RIBBON_ENABLED`.
3. Ensure text content is never blocked by overlays.

**Tests (Browser):**

- `/lab/dna-ribbon.html` with dense vs sparse markers.
- Contrast checks and tooltip accessibility.

---

## Feature 8. Tech Stack Carousel with Meaning

**Goal:** Replace raw badges with contextual skill tiles.

**User Story:** On hover, I see what you used each tool for. Example: “LangGraph → multi‑agent orchestration for PulseMap”.

**UX Spec:**

- Horizontal scroll carousel with snap, tiles expand slightly on hover.
- Each tile has icon, short usage line, and link to a project.

**Tech Choices:**

- CSS scroll‑snap; small JS for hover details; no heavy carousel library.
- Static fallback as a responsive grid.

**Integration Steps:**

1. `public/assets/stack/stack.json` entries with name, icon, usage, link.
2. `StackCarousel.tsx` with snap and hover details; flag `STACK_CAROUSEL_ENABLED`.
3. Provide keyboard scrollers and visible focus states.

**Tests (Browser):**

- `/lab/stack-carousel.html` with long and short lists.
- Mobile flick gestures tested.

---

## Feature 10. Project Architecture Diagrams (Animated)

**Try with Banana Pro hand‑drawn images**

**Goal:** Upgrade static diagrams to animated, hand‑drawn‑style diagrams that still feel professional.

**User Story:** I can understand the system architecture quickly through simple, sketched diagrams with minimal motion.

**UX Spec:**

- Use Banana Pro to draw clean hand‑sketched diagrams for each project, export as SVG/PNG.
- Animate only strokes that indicate data flow using SVG stroke‑dashoffset.
- Provide a “View static” toggle for accessibility.

**Tech Choices:**

- Banana Pro for sketches, then optimize SVG with SVGO.
- Animate with CSS or GSAP, depending on complexity.

**Integration Steps:**

1. Export hand‑drawn diagrams to `public/assets/diagrams/<project>/*.svg`.
2. `ProjectDiagram.tsx` renders diagram with optional flow animation; flag `DIAGRAMS_ENABLED`.
3. Ensure text remains selectable and alt text describes the architecture in one sentence.

**Tests (Browser):**

- `/lab/diagrams.html` with 2–3 project diagrams.
- CPU usage check, ensure no reflow loops.

---

## Integration Phases

**Phase 0 — Lab Setup**

- Create `/lab/` directory with a neutral HTML shell and shared CSS.
- Add a small “Feature Switcher” on `/lab/index.html` to navigate to each demo.

**Phase 1 — Low‑Risk Visuals**

- Feature 6 Metrics
- Feature 8 Stack Carousel
- Feature 1 Hero Flow

**Phase 2 — Medium Interaction**

- Feature 4 Agent Visualizer
- Feature 10 Diagrams (Banana Pro exports)

**Phase 3 — 3D & Scroll**

- Feature 2 Skill Graph 3D
- Feature 3 Deployment Timeline
- Feature 7 DNA Ribbon

**Phase 4 — Optional Console**

- Feature 5 AI Console Overlay

Ship each phase only after passing lab tests and Lighthouse checks.

---

## Accessibility & Performance Guardrails

- Implement `prefers-reduced-motion` fallbacks for all animated features.
- Minimum color contrast 4.5:1 for body text.
- Preload critical assets with `rel=preload` cautiously.
- Lazy‑load non‑critical modules. Hydrate only when needed.
- Limit main thread blocking to < 50 ms for any animation init.
- Defer Three.js scenes until they are visible; cap object count and texture sizes.
- Provide static images for print and offline.

---

## Browser Test Matrix (Self‑Testing)

**Targets:**

- Chrome (latest), Edge (latest), Firefox (latest), Safari 16+
- iOS Safari 16+, Chrome Android latest

**What to test:**

- First meaningful paint unaffected by animations.
- All toggles work with keyboard and `Esc`.
- Reduced‑motion rendering and static fallbacks.
- No layout shift on animation start/end.
- Mobile: touch scroll, tap targets ≥ 44 px, scroll‑snap stability.
- Printing: pages render with static imagery and no hidden content.

**Tools:**

- Lighthouse (Performance, Accessibility, Best Practices, SEO)
- Chrome DevTools Performance panel (FPS, CPU)
- Axe DevTools or Lighthouse a11y audits

---

## Rollback & Observability

- Each feature behind a flag in `src/flags.ts`.
- Add a global “Disable Animations” toggle in the site footer.
- Simple console logs in lab pages to record FPS and hydrating times during manual tests.
- Keep a `CHANGELOG.md` for each feature rollout with “issues seen” and “next actions”.

---

## Deliverables Checklist

- [ ] `/lab/index.html` hub and one demo page per feature
- [ ] Feature flags in `src/flags.ts`
- [ ] Assets in `public/assets/*`
- [ ] Reduced‑motion fallbacks implemented
- [ ] Lighthouse score reports saved under `/lab/reports/`
- [ ] Toggleable console overlay wired to example JSON
- [ ] Banana Pro diagrams exported and optimized

---

## Success Criteria

- Visuals reinforce your brand as an AI/ML systems engineer.
- Site remains fast, legible, and accessible.
- Recruiters understand key skills and results in under 30 seconds.
- All features demo cleanly in browser lab pages before integration.
