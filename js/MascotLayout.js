(function attachMascotLayout(globalScope) {
  class MascotLayout {
    constructor({ config, documentRef, windowRef } = {}) {
      this.config = config || globalScope.MascotConfig;
      this.document =
        documentRef || (globalScope.document ? globalScope.document : null);
      this.window = windowRef || globalScope;
      this.anchorMap = new Map();
      this.sectionMap = new Map();
      this.textMap = new Map();
      this.activeSectionId = null;
      this.viewport = {
        width: 0,
        height: 0,
      };
      this.sectionVisibility = new Map();
      this.pretext = globalScope.PretextLayout || null;
      this.pretextMode = this.pretext ? "native" : "fallback";
      this.preparedTextCache = new Map();
      this.pendingRefreshFrame = null;
      this.pendingSectionFrame = null;
      this.boundRefresh = this.scheduleRefresh.bind(this);
      this.boundResolveSection = this.scheduleSectionResolve.bind(this);
      this.onSectionChange = null;
      this.onLayoutChange = null;
      this.sectionObserver = null;
      this.resizeObserver = null;

      if (
        !this.pretext &&
        this.window &&
        this.window.__pretextReady &&
        typeof this.window.__pretextReady.then === "function"
      ) {
        this.window.__pretextReady.then((module) => {
          if (!module) {
            return;
          }

          this.pretext = module;
          this.pretextMode = "native";
          this.preparedTextCache.clear();
          this.scheduleRefresh();
        });
      }
    }

    refresh() {
      if (!this.document) {
        return;
      }

      this.viewport = this.readViewport();
      this.sectionMap = this.collectSections();
      this.textMap = this.collectTextRegions();
      this.anchorMap = this.collectAnchors();
      this.activeSectionId = this.resolveActiveSection();
      return this.snapshot();
    }

    observe({ onSectionChange, onLayoutChange } = {}) {
      if (!this.document || !this.window) {
        return;
      }

      this.onSectionChange = onSectionChange || null;
      this.onLayoutChange = onLayoutChange || null;

      this.refresh();

      if (typeof this.window.addEventListener === "function") {
        this.window.addEventListener("scroll", this.boundRefresh, {
          passive: true,
        });
        this.window.addEventListener("resize", this.boundRefresh, {
          passive: true,
        });
      }

      if (typeof this.window.IntersectionObserver === "function") {
        this.sectionObserver = new this.window.IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const id = entry.target.dataset.mascotSection;
              if (id) {
                this.sectionVisibility.set(id, entry.intersectionRatio);
              }
            });
            this.scheduleSectionResolve();
          },
          {
            threshold: [0.12, 0.25, 0.4, 0.6, 0.8],
          }
        );

        this.sectionMap.forEach((section) => {
          this.sectionObserver.observe(section.node);
        });
      }

      if (typeof this.window.ResizeObserver === "function") {
        this.resizeObserver = new this.window.ResizeObserver(this.boundRefresh);
        this.sectionMap.forEach((section) => {
          this.resizeObserver.observe(section.node);
        });
        this.anchorMap.forEach((anchor) => {
          this.resizeObserver.observe(anchor.node);
        });
        this.textMap.forEach((region) => {
          this.resizeObserver.observe(region.node);
        });
      }

      this.notifySectionChange(true);
    }

    destroy() {
      if (this.window && typeof this.window.removeEventListener === "function") {
        this.window.removeEventListener("scroll", this.boundRefresh);
        this.window.removeEventListener("resize", this.boundRefresh);
      }

      if (this.sectionObserver) {
        this.sectionObserver.disconnect();
        this.sectionObserver = null;
      }

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      if (this.pendingRefreshFrame && this.window.cancelAnimationFrame) {
        this.window.cancelAnimationFrame(this.pendingRefreshFrame);
        this.pendingRefreshFrame = null;
      }

      if (this.pendingSectionFrame && this.window.cancelAnimationFrame) {
        this.window.cancelAnimationFrame(this.pendingSectionFrame);
        this.pendingSectionFrame = null;
      }
    }

    scheduleRefresh() {
      if (this.pendingRefreshFrame || !this.window) {
        return;
      }

      const raf =
        this.window.requestAnimationFrame ||
        ((callback) => this.window.setTimeout(() => callback(Date.now()), 16));

      this.pendingRefreshFrame = raf(() => {
        this.pendingRefreshFrame = null;
        this.refresh();
        if (typeof this.onLayoutChange === "function") {
          this.onLayoutChange(this.snapshot());
        }
        this.notifySectionChange();
      });
    }

    scheduleSectionResolve() {
      if (this.pendingSectionFrame || !this.window) {
        return;
      }

      const raf =
        this.window.requestAnimationFrame ||
        ((callback) => this.window.setTimeout(() => callback(Date.now()), 16));

      this.pendingSectionFrame = raf(() => {
        this.pendingSectionFrame = null;
        this.notifySectionChange();
      });
    }

    snapshot() {
      return {
        anchors: Array.from(this.anchorMap.values()),
        sections: Array.from(this.sectionMap.values()),
        textRegions: Array.from(this.textMap.values()),
        activeSectionId: this.activeSectionId,
        pretextMode: this.pretextMode,
        viewport: this.viewport,
      };
    }

    readViewport() {
      const docEl = this.document ? this.document.documentElement : null;
      return {
        width:
          (this.window && this.window.innerWidth) ||
          (docEl && docEl.clientWidth) ||
          1280,
        height:
          (this.window && this.window.innerHeight) ||
          (docEl && docEl.clientHeight) ||
          800,
      };
    }

    collectSections() {
      const map = new Map();
      const nodes = this.document.querySelectorAll(this.config.sectionSelector);
      nodes.forEach((node, index) => {
        const id = node.dataset.mascotSection;
        if (!id) {
          return;
        }

        map.set(id, {
          id,
          node,
          order: index,
          rect: this.rectFromNode(node),
        });
      });
      return map;
    }

    collectTextRegions() {
      const map = new Map();
      this.config.textRegions.forEach((definition) => {
        const node = this.document.querySelector(definition.selector);
        if (!node) {
          return;
        }

        const boxes = this.measureLineBoxes(node);
        const bounds = this.mergeBounds(boxes);
        map.set(definition.id, {
          id: definition.id,
          node,
          boxes,
          bounds,
          sectionId:
            definition.sectionId ||
            node.closest(this.config.sectionSelector)?.dataset.mascotSection ||
            null,
        });
      });
      return map;
    }

    collectAnchors() {
      const map = new Map();
      this.config.anchorDefinitions.forEach((definition, index) => {
        const node = this.document.querySelector(definition.selector);
        if (!node) {
          return;
        }

        const sectionId =
          definition.sectionId ||
          node.closest(this.config.sectionSelector)?.dataset.mascotSection ||
          null;
        const restEdge = node.dataset.mascotRest || definition.restEdge || "right";
        const behaviors = this.config.parseBehaviors(
          node.dataset.mascotBehaviors,
          definition.behaviors
        );
        const rect = this.rectFromNode(node);
        const lineRegion =
          definition.lineRegionId && this.textMap.has(definition.lineRegionId)
            ? this.textMap.get(definition.lineRegionId)
            : null;
        const point = this.computeRestPoint({
          rect,
          restEdge,
          lineRegion: definition.restFromLineRegion ? lineRegion : null,
        });
        const outward = this.getOutwardVector(restEdge);
        const tangent = this.getTangentVector(restEdge);
        const crawlPoints = this.buildCrawlPoints({
          point,
          rect,
          restEdge,
          outward,
          tangent,
          lineRegion,
        });

        map.set(definition.id, {
          id: definition.id,
          node,
          order: index,
          priority:
            Number(node.dataset.mascotPriority || definition.priority || 50),
          rect,
          sectionId,
          restEdge,
          behaviors,
          point,
          crawlPoints,
          inspectVector: {
            x: -outward.x,
            y: -outward.y,
          },
          lineRegionId: definition.lineRegionId || null,
        });
      });
      return map;
    }

    rectFromNode(node) {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    }

    mergeBounds(boxes) {
      if (!boxes.length) {
        return {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        };
      }

      const left = Math.min(...boxes.map((box) => box.left));
      const top = Math.min(...boxes.map((box) => box.top));
      const right = Math.max(...boxes.map((box) => box.right));
      const bottom = Math.max(...boxes.map((box) => box.bottom));

      return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
      };
    }

    measureLineBoxes(node) {
      const nativeBoxes = this.measureWithPretext(node);
      if (nativeBoxes.length) {
        this.pretextMode = "native";
        return this.mergeLineBoxes(nativeBoxes);
      }

      const boxes = [];

      if (this.document && typeof this.document.createRange === "function") {
        try {
          const range = this.document.createRange();
          range.selectNodeContents(node);
          if (typeof range.getClientRects === "function") {
            boxes.push(
              ...Array.from(range.getClientRects()).map((rect) => ({
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
              }))
            );
          }
          if (typeof range.detach === "function") {
            range.detach();
          }
        } catch (error) {
          this.pretextMode = "fallback";
        }
      }

      if (!boxes.length && typeof node.getClientRects === "function") {
        boxes.push(
          ...Array.from(node.getClientRects()).map((rect) => ({
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          }))
        );
      }

      if (!boxes.length) {
        boxes.push(this.rectFromNode(node));
      }

      return this.mergeLineBoxes(boxes);
    }

    measureWithPretext(node) {
      // V1: Pretext line measurement is disabled until Phase 3.
      // DOM Range fallback in measureLineBoxes() is fully sufficient for
      // anchor-graph positioning. Phase 3 re-enables this for precise
      // line-edge crawl points (spider walking along exact line tops/ends).
      return [];
      // --- Phase 3 code below (preserved for re-enablement) ---
      // eslint-disable-next-line no-unreachable
      if (
        !this.pretext ||
        typeof this.window?.getComputedStyle !== "function" ||
        typeof this.pretext.prepareWithSegments !== "function" ||
        typeof this.pretext.layoutWithLines !== "function"
      ) {
        return [];
      }

      try {
        const text = node.textContent || "";
        if (!text.trim()) {
          return [];
        }

        const style = this.window.getComputedStyle(node);
        const font = this.buildCanvasFont(style);
        const maxWidth = this.measureTextContentWidth(node, style);
        const lineHeight = this.parseLineHeight(style);

        if (!font || maxWidth <= 0 || lineHeight <= 0) {
          return [];
        }

        const whiteSpace = style.whiteSpace === "pre-wrap" ? "pre-wrap" : "normal";
        const wordBreak = style.wordBreak === "keep-all" ? "keep-all" : "normal";
        const cacheKey = [text, font, whiteSpace, wordBreak].join("::");
        let prepared = this.preparedTextCache.get(cacheKey);

        if (!prepared) {
          prepared = this.pretext.prepareWithSegments(text, font, {
            whiteSpace,
            wordBreak,
          });
          this.preparedTextCache.set(cacheKey, prepared);
        }

        const layout = this.pretext.layoutWithLines(prepared, maxWidth, lineHeight);
        const rect = this.rectFromNode(node);
        const align = style.textAlign;
        const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(style.paddingRight) || 0;
        const paddingTop = Number.parseFloat(style.paddingTop) || 0;
        const contentLeft = rect.left + paddingLeft;
        const contentTop = rect.top + paddingTop;
        const availableWidth = rect.width - paddingLeft - paddingRight;

        return layout.lines.map((line, index) => {
          const offsetX = this.resolveLineOffsetX(align, availableWidth, line.width);
          const top = contentTop + index * lineHeight;
          return {
            left: contentLeft + offsetX,
            top,
            right: contentLeft + offsetX + line.width,
            bottom: top + lineHeight,
            width: line.width,
            height: lineHeight,
          };
        });
      } catch (error) {
        this.pretextMode = "fallback";
      }

      return [];
    }

    buildCanvasFont(style) {
      const fontStyle = style.fontStyle || "normal";
      const fontVariant = style.fontVariant || "normal";
      const fontWeight = style.fontWeight || "400";
      const fontStretch = style.fontStretch && style.fontStretch !== "100%"
        ? `${style.fontStretch} `
        : "";
      const fontSize = style.fontSize || "16px";
      const fontFamily = style.fontFamily || "sans-serif";
      return `${fontStyle} ${fontVariant} ${fontWeight} ${fontStretch}${fontSize} ${fontFamily}`
        .replace(/\s+/g, " ")
        .trim();
    }

    parseLineHeight(style) {
      const parsed = Number.parseFloat(style.lineHeight);
      if (Number.isFinite(parsed)) {
        return parsed;
      }

      const fontSize = Number.parseFloat(style.fontSize) || 16;
      return fontSize * 1.65;
    }

    measureTextContentWidth(node, style) {
      const rect = this.rectFromNode(node);
      const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(style.paddingRight) || 0;
      return Math.max(0, rect.width - paddingLeft - paddingRight);
    }

    resolveLineOffsetX(align, availableWidth, lineWidth) {
      if (align === "center") {
        return Math.max(0, (availableWidth - lineWidth) * 0.5);
      }

      if (align === "right" || align === "end") {
        return Math.max(0, availableWidth - lineWidth);
      }

      return 0;
    }

    mergeLineBoxes(boxes) {
      const validBoxes = boxes
        .filter((box) => box.width > 0 && box.height > 0)
        .sort((left, right) => {
          if (Math.abs(left.top - right.top) > 3) {
            return left.top - right.top;
          }
          return left.left - right.left;
        });

      const merged = [];

      validBoxes.forEach((box) => {
        const existing = merged[merged.length - 1];
        if (existing && Math.abs(existing.top - box.top) <= 4) {
          existing.left = Math.min(existing.left, box.left);
          existing.right = Math.max(existing.right, box.right);
          existing.top = Math.min(existing.top, box.top);
          existing.bottom = Math.max(existing.bottom, box.bottom);
          existing.width = existing.right - existing.left;
          existing.height = existing.bottom - existing.top;
          return;
        }

        merged.push({ ...box });
      });

      return merged;
    }

    computeRestPoint({ rect, restEdge, lineRegion }) {
      const boxes = lineRegion?.boxes?.length ? lineRegion.boxes : null;
      const gap = this.config.anchorGap;
      const first = boxes ? boxes[0] : null;
      const last = boxes ? boxes[boxes.length - 1] : null;
      const middle = boxes ? boxes[Math.floor(boxes.length / 2)] : null;

      let point;

      switch (restEdge) {
        case "top-left":
          point = {
            x: (first ? first.left : rect.left) - gap,
            y: (first ? first.top : rect.top) - gap * 0.8,
          };
          break;
        case "top-right":
          point = {
            x: (last ? last.right : rect.right) + gap,
            y: (first ? first.top : rect.top) - gap * 0.8,
          };
          break;
        case "bottom-left":
          point = {
            x: (last ? last.left : rect.left) - gap * 0.65,
            y: (last ? last.bottom : rect.bottom) + gap * 0.68,
          };
          break;
        case "left":
          point = {
            x: (middle ? middle.left : rect.left) - gap,
            y: (middle ? middle.top + middle.height * 0.5 : rect.top + rect.height * 0.38),
          };
          break;
        case "right":
        default:
          point = {
            x: (middle ? middle.right : rect.right) + gap,
            y: (middle ? middle.top + middle.height * 0.5 : rect.top + rect.height * 0.38),
          };
          break;
      }

      return this.clampPoint(point);
    }

    buildCrawlPoints({ point, rect, restEdge, outward, tangent, lineRegion }) {
      const fallbackPoints = [
        this.clampPoint({
          x: point.x + tangent.x * 34 + outward.x * 4,
          y: point.y + tangent.y * 34 + outward.y * 4,
        }),
        this.clampPoint({
          x: point.x - tangent.x * 26 + outward.x * 2,
          y: point.y - tangent.y * 26 + outward.y * 2,
        }),
      ];

      if (!lineRegion?.boxes?.length) {
        return fallbackPoints;
      }

      const shellHalf = this.config.shellSize * 0.5;
      const gap = this.config.anchorGap;
      const lanePoints = [];

      lineRegion.boxes.forEach((box, index) => {
        const verticalLift = shellHalf * 0.72 + gap * 0.1;
        lanePoints.push(
          this.clampPoint({
            x: box.left - shellHalf * 0.55,
            y: box.top - verticalLift,
          })
        );

        if (index === lineRegion.boxes.length - 1) {
          lanePoints.push(
            this.clampPoint({
              x: box.right + shellHalf * 0.52,
              y: box.top - verticalLift * 0.84,
            })
          );
        }
      });

      if (restEdge === "top-left" || restEdge === "top-right") {
        lanePoints.unshift(point);
      } else {
        lanePoints.push(point);
      }

      return lanePoints.slice(0, 3);
    }

    clampPoint(point) {
      const padding = this.config.viewportPadding;
      const halfSize = this.config.shellSize * 0.45;
      return {
        x: this.config.clamp(
          point.x,
          padding + halfSize,
          this.viewport.width - padding - halfSize
        ),
        y: this.config.clamp(
          point.y,
          this.config.headerOffset,
          this.viewport.height - padding - halfSize
        ),
      };
    }

    getOutwardVector(edge) {
      switch (edge) {
        case "top-left":
          return this.normalize({ x: -1, y: -0.8 });
        case "top-right":
          return this.normalize({ x: 1, y: -0.8 });
        case "bottom-left":
          return this.normalize({ x: -1, y: 0.9 });
        case "left":
          return { x: -1, y: 0 };
        case "right":
        default:
          return { x: 1, y: 0 };
      }
    }

    getTangentVector(edge) {
      switch (edge) {
        case "left":
        case "right":
          return { x: 0, y: 1 };
        case "bottom-left":
          return this.normalize({ x: 1, y: 0.18 });
        case "top-left":
        case "top-right":
        default:
          return this.normalize({ x: 1, y: 0.15 });
      }
    }

    normalize(vector) {
      const length = Math.hypot(vector.x, vector.y) || 1;
      return {
        x: vector.x / length,
        y: vector.y / length,
      };
    }

    notifySectionChange(force = false) {
      const nextId = this.resolveActiveSection();
      if (!nextId) {
        return;
      }

      const changed = force || nextId !== this.activeSectionId;
      this.activeSectionId = nextId;

      if (changed && typeof this.onSectionChange === "function") {
        this.onSectionChange(nextId);
      }
    }

    resolveActiveSection() {
      const sections = Array.from(this.sectionMap.values());
      if (!sections.length) {
        return null;
      }

      const focusLine = Math.max(this.config.headerOffset + 48, this.viewport.height * 0.36);
      let bestSection = sections[0];
      let bestScore = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const ratio = this.sectionVisibility.get(section.id) || 0;
        const rect = section.rect;
        const containsFocus = rect.top <= focusLine && rect.bottom >= focusLine;
        const distance = containsFocus
          ? -ratio - rect.height * 0.0001
          : Math.min(Math.abs(rect.top - focusLine), Math.abs(rect.bottom - focusLine)) -
            ratio * 60;

        if (distance < bestScore) {
          bestScore = distance;
          bestSection = section;
        }
      });

      return bestSection.id;
    }

    getActiveSectionId() {
      return this.activeSectionId;
    }

    getAnchorsForSection(sectionId) {
      return Array.from(this.anchorMap.values())
        .filter((anchor) => anchor.sectionId === sectionId)
        .sort((left, right) => {
          if (left.priority !== right.priority) {
            return left.priority - right.priority;
          }
          return left.order - right.order;
        });
    }

    getAnchor(anchorId) {
      return this.anchorMap.get(anchorId) || null;
    }

    getFirstAnchor() {
      return Array.from(this.anchorMap.values())[0] || null;
    }

    getDockedPoint() {
      return {
        x: this.viewport.width - this.config.dockedMargin.x - this.config.shellSize * 0.52,
        y: this.viewport.height - this.config.dockedMargin.y - this.config.shellSize * 0.44,
      };
    }
  }

  globalScope.MascotLayout = MascotLayout;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MascotLayout;
  }
})(typeof window !== "undefined" ? window : globalThis);
