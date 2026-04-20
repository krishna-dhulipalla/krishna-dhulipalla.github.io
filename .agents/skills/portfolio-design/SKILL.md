---
name: Portfolio Design System
description: Recreates the design tokens, typography, colors, and specific visual glitch/Spider-Verse animations of the portfolio website.
---

# Portfolio Design System Skill

This skill provides instructions on how to replicate the portfolio website's aesthetic for other applications like a personal chatbot. It focuses exclusively on the design tokens, fonts, colors, layouts, and the unique CSS-based animations/effects.

## 1. Typography
Use the following font pairings sourced from Google Fonts:
- **Headings & Display Text:** `Source Serif 4` (serif) - Use for all major titles (`display-heading`, `section-title`, etc.), usually with tight letter spacing (`letter-spacing: -0.03em`).
- **Body Text:** `IBM Plex Sans` (sans-serif) - Standard reading text with `line-height: 1.65` and `letter-spacing: -0.01em`.
- **Labels, Eyebrows & Meta:** `IBM Plex Mono` (monospace) - Used for small caps labels, numbering, and metadata. Usually `text-transform: uppercase` with generous tracking (`letter-spacing: 0.12em`).

## 2. Color Palette
Implement a theme-aware color system with Light and Dark modes.

**Light Mode:**
- Backgrounds: Paper (`#f4efe6`), Strong Paper (`#fcf8f1`), Panel (`#f7f1e8`)
- Text/Ink: Primary Ink (`#171412`), Soft Ink (`#5d564f`)
- Accents: 
  - Blue: `#4e67b6`
  - Rust: `#ba5a45`
  - Teal: `#1a766c`

**Dark Mode:**
- Backgrounds: Paper (`#11100f`), Strong Paper (`#181614`), Panel (`#141210`)
- Text/Ink: Primary Ink (`#f2ede4`), Soft Ink (`#b7aea2`)
- Accents:
  - Blue: `#8fa7ff`
  - Rust: `#ef8d74`
  - Teal: `#62c2b4`

*Note: Use drop shadows consistently combining the blue and rust accent colors with low opacity (e.g., `4px 4px 0 var(--shadow-blue), -2px -2px 0 rgba(186, 90, 69, 0.04)`).*

## 3. Background Textures
The site background is subtle infrastructure, not a visible pattern layer.

Use the textures exactly as faint fixed overlays on the page background:
- `body::before`: two tiny `radial-gradient` dot fields with `background-size: 13px 13px, 19px 19px`, `background-position: 0 0, 7px 5px`, `opacity: 0.3`, and `mix-blend-mode: multiply`.
- `body::after`: one very sparse vertical structure line pattern using `linear-gradient(to right, transparent 0, transparent calc(100% - 1px), var(--grid-line) calc(100% - 1px), var(--grid-line) 100%) 6rem 0 / 25rem 100% no-repeat` with `opacity: 0.18`.

Important constraints:
- Keep both layers `position: fixed`, `inset: 0`, and `pointer-events: none`.
- These are page-level atmospheric textures, not decorative grids on cards, panels, or sections.
- The effect should read as paper/noise depth from a distance, not as obvious dots or graph paper.
- Do not increase contrast, density, line count, or opacity to make the pattern "show up more".
- Do not turn the vertical line layer into a repeating full-screen grid in both directions.

## 4. "Spider-Verse" Glitch Animations
The most unique feature is the chromatic aberration and glitch animations applied to text.

**Methodology:**
- An element with `spider-title` or `spider-field` adds a `data-text` attribute matching the element's inner text.
- CSS `::before` and `::after` pseudo-elements are generated using `content: attr(data-text)`, layered directly on top of the original text text (`position: absolute; inset: 0`).
- The `::before` element is tinted Blue and the `::after` element is tinted Rust, utilizing `mix-blend-mode: multiply` (Light mode) or `mix-blend-mode: screen` (Dark mode).

**Animation Types:**
1. **Calm Glitch (`spider-title`)**: 
   - Always active.
   - Gently animates the X and Y translation of the pseudo-elements periodically using `steps(2, end)` or `steps(4, end)` to create a jerky, frame-by-frame offset effect (`calmSpiderBlue` and `calmSpiderRust` keyframes).
2. **Hover Glitch (`spider-field`, `spider-hover`)**:
   - Inactive by default (`opacity: 0`).
   - On hover, opacity increases and triggers the jitter shift keyframes, adding a brief chromatic tear to the element.
3. **Chroma Ink Text Shadow**:
   - Text shadows are used on headings like `chroma-ink` to create a static chromatic aberration edge: `text-shadow: 0.015em 0 0 var(--spider-blue), -0.015em 0 0 var(--spider-rust)`.
4. **Intense Datamoshing and Slicing**:
   - Advanced glitch elements use `clip-path` slicing (`glitch-slice-a`, `glitch-slice-b`) and horizontal scanning bands (`glitch-scan` with `datamoshBand` keyframes).
   - Random blur (`glitchPulse`) and physical jitter (`digitJitter`) keyframes simulate heavy digital corruption.

## Implementation Guide
When applying this to a new component (like a chatbot):
1. Establish the color variables first.
2. Load the google fonts (`IBM Plex Sans`, `IBM Plex Mono`, `Source Serif 4`).
3. Add the exact low-contrast `body::before` and `body::after` background overlays, keeping them subtle and page-level only.
4. Wrap any headers or important labels in elements with `spider-hover` or `spider-title` classes, ensuring you mirror the text in the `data-text` attribute.
5. Apply the `::before`/`::after` CSS to create the RGB offset effect whenever hovered or active.
