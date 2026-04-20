(function attachMascotController(globalScope) {
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function easeInOutQuad(value) {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  function normalize(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  class MascotController {
    constructor({ layout, renderer, config, documentRef, windowRef } = {}) {
      this.config = config || globalScope.MascotConfig;
      this.layout = layout;
      this.renderer = renderer;
      this.document =
        documentRef || (globalScope.document ? globalScope.document : null);
      this.window = windowRef || globalScope;

      this.body = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      };
      this.legs = this.config.legs.map((definition) => ({
        definition,
        // planted and current are stored in BODY-RELATIVE SVG units.
        // They are offsets from the body center in the SVG coordinate space,
        // matching the viewBox system used by the renderer (leg.base, leg.tip).
        // This avoids any global viewport-pixel contamination.
        planted: {
          x: definition.rest.x,
          y: definition.rest.y,
        },
        current: {
          x: definition.rest.x,
          y: definition.rest.y,
        },
        step: null,
        cooldown: 0,
      }));
      this.heading = 0;
      this.clock = 0;
      this.state = "rest";
      this.stateRemaining = 0;
      this.running = false;
      this.started = false;
      this.frameId = null;
      this.lastTimestamp = 0;
      this.activeSectionId = null;
      this.currentAnchorId = null;
      this.travelAnchorId = null;
      this.travelPoint = null;
      this.sectionCursor = new Map();
      this.crawlCursor = new Map();
      this.legPhaseCursor = 0;
      this.isReducedMotion = false;
      this.isDisabled = false;
      this.burstRemaining = 0;
      this.nextInspectBurstAt = this.config.randomBetween(
        this.config.burst.cooldown[0],
        this.config.burst.cooldown[1]
      );
      this.mediaQuery =
        this.window && typeof this.window.matchMedia === "function"
          ? this.window.matchMedia("(prefers-reduced-motion: reduce)")
          : null;

      this.tick = this.tick.bind(this);
      this.handleSectionChange = this.handleSectionChange.bind(this);
      this.handleLayoutChange = this.handleLayoutChange.bind(this);
      this.handleMotionPreference = this.handleMotionPreference.bind(this);
    }

    start() {
      if (this.started) {
        return this;
      }

      this.started = true;

      if (this.mediaQuery) {
        if (typeof this.mediaQuery.addEventListener === "function") {
          this.mediaQuery.addEventListener("change", this.handleMotionPreference);
        } else if (typeof this.mediaQuery.addListener === "function") {
          this.mediaQuery.addListener(this.handleMotionPreference);
        }
      }

      this.layout.refresh();
      this.activeSectionId =
        this.layout.getActiveSectionId() || this.layout.snapshot().sections[0]?.id || null;

      const initialAnchor =
        this.pickAnchor(this.activeSectionId) || this.layout.getFirstAnchor();
      if (!initialAnchor) {
        this.renderer.setDisabled(true);
        this.isDisabled = true;
        return this;
      }

      this.currentAnchorId = initialAnchor.id;
      this.syncBodyToPoint(initialAnchor.point);
      this.initializeLegs();

      this.layout.observe({
        onSectionChange: this.handleSectionChange,
        onLayoutChange: this.handleLayoutChange,
      });

      this.applyRuntimeMode({ immediate: true });
      return this;
    }

    stop() {
      this.running = false;
      if (this.frameId && this.window.cancelAnimationFrame) {
        this.window.cancelAnimationFrame(this.frameId);
      }
      this.frameId = null;

      if (this.mediaQuery) {
        if (typeof this.mediaQuery.removeEventListener === "function") {
          this.mediaQuery.removeEventListener("change", this.handleMotionPreference);
        } else if (typeof this.mediaQuery.removeListener === "function") {
          this.mediaQuery.removeListener(this.handleMotionPreference);
        }
      }

      this.layout.destroy();
    }

    handleMotionPreference() {
      this.applyRuntimeMode();
    }

    handleSectionChange(sectionId) {
      const previousSectionId = this.activeSectionId;
      this.activeSectionId = sectionId;
      if (previousSectionId === sectionId) {
        return;
      }

      if (this.isDisabled) {
        return;
      }

      if (this.isReducedMotion) {
        this.renderDocked();
        return;
      }

      const nextAnchor = this.pickAnchor(sectionId, {
        preferDifferent: true,
      });

      if (nextAnchor) {
        this.travelAnchorId = nextAnchor.id;
        this.travelPoint = nextAnchor.point;
        this.enterState("zip");
      }
    }

    handleLayoutChange() {
      if (this.isDisabled) {
        return;
      }

      if (this.isReducedMotion) {
        this.renderDocked();
        return;
      }

      if (this.travelAnchorId) {
        const travelAnchor = this.layout.getAnchor(this.travelAnchorId);
        if (travelAnchor) {
          this.travelPoint =
            this.state === "crawl" && travelAnchor.id === this.currentAnchorId
              ? this.travelPoint
              : travelAnchor.point;
        }
      }

      if (!this.currentAnchorId) {
        const fallbackAnchor =
          this.pickAnchor(this.activeSectionId) || this.layout.getFirstAnchor();
        this.currentAnchorId = fallbackAnchor?.id || null;
      }
    }

    applyRuntimeMode({ immediate = false } = {}) {
      const width =
        (this.window && this.window.innerWidth) ||
        (this.document && this.document.documentElement.clientWidth) ||
        1280;
      const nextDisabled = width <= this.config.mobileMaxWidth;
      const nextReduced = Boolean(this.mediaQuery && this.mediaQuery.matches);

      this.isDisabled = nextDisabled;
      this.isReducedMotion = !nextDisabled && nextReduced;

      if (this.isDisabled) {
        this.running = false;
        this.renderer.setDisabled(true);
        if (this.frameId && this.window.cancelAnimationFrame) {
          this.window.cancelAnimationFrame(this.frameId);
        }
        this.frameId = null;
        return;
      }

      this.renderer.setDisabled(false);

      if (this.isReducedMotion) {
        this.running = false;
        if (this.frameId && this.window.cancelAnimationFrame) {
          this.window.cancelAnimationFrame(this.frameId);
        }
        this.frameId = null;
        this.renderDocked();
        return;
      }

      if (immediate) {
        this.enterState("rest");
      }

      if (!this.running) {
        this.running = true;
        this.lastTimestamp =
          (this.window.performance && this.window.performance.now
            ? this.window.performance.now()
            : Date.now());
        this.frameId = this.window.requestAnimationFrame(this.tick);
      }
    }

    renderDocked() {
      const dockedPoint = this.layout.getDockedPoint();
      this.syncBodyToPoint(dockedPoint, { resetVelocity: true });
      this.initializeLegs();
      this.renderer.render(this.buildScene({ docked: true }));
    }

    syncBodyToPoint(point, { resetVelocity = true } = {}) {
      this.body.x = point.x;
      this.body.y = point.y;
      if (resetVelocity) {
        this.body.vx = 0;
        this.body.vy = 0;
      }
    }

    initializeLegs() {
      this.legs.forEach((leg) => {
        // Reset to body-relative rest offsets in SVG units.
        // No body position involved — legs are always relative to body center.
        leg.planted = {
          x: leg.definition.rest.x,
          y: leg.definition.rest.y,
        };
        leg.current = { ...leg.planted };
        leg.step = null;
        leg.cooldown = 0;
      });
    }

    tick(timestamp) {
      if (!this.running) {
        return;
      }

      const elapsed = Math.min(Math.max((timestamp - this.lastTimestamp) / 1000, 0.012), 0.05);
      this.lastTimestamp = timestamp;
      this.clock += elapsed;
      this.stateRemaining -= elapsed;
      this.updateBurst(elapsed);

      this.updateMotion(elapsed);
      this.updateHeading(elapsed);
      this.updateLegs(elapsed);
      this.renderer.render(this.buildScene());
      this.advanceState();

      this.frameId = this.window.requestAnimationFrame(this.tick);
    }

    updateMotion(deltaTime) {
      const target = this.resolveTargetPoint();
      const springProfile = this.config.spring[this.state] || this.config.spring.rest;
      const damping = Math.pow(springProfile.damping, deltaTime * 60);
      const dx = target.x - this.body.x;
      const dy = target.y - this.body.y;

      this.body.vx = (this.body.vx + dx * springProfile.stiffness * deltaTime) * damping;
      this.body.vy = (this.body.vy + dy * springProfile.stiffness * deltaTime) * damping;

      const speed = Math.hypot(this.body.vx, this.body.vy);
      if (speed > springProfile.maxSpeed) {
        const limited = springProfile.maxSpeed / speed;
        this.body.vx *= limited;
        this.body.vy *= limited;
      }

      this.body.x += this.body.vx * deltaTime;
      this.body.y += this.body.vy * deltaTime;
    }

    resolveTargetPoint() {
      if (this.isReducedMotion) {
        return this.layout.getDockedPoint();
      }

      const anchor = this.layout.getAnchor(
        this.state === "zip" || this.state === "crawl" ? this.travelAnchorId : this.currentAnchorId
      );
      const basePoint =
        this.state === "zip" || this.state === "crawl"
          ? this.travelPoint || anchor?.point || this.layout.getDockedPoint()
          : anchor?.point || this.layout.getDockedPoint();

      if (this.state === "crawl" || this.state === "zip") {
        return basePoint;
      }

      const swayScale =
        this.state === "inspect" ? 0.34 : this.state === "idle" ? 1 : 0.56;
      const inspectVector = anchor?.inspectVector || { x: 0.8, y: 0.12 };

      return {
        x:
          basePoint.x +
          Math.sin(this.clock * this.config.sway.rate + this.hashAnchorPhase()) *
            this.config.sway.x *
            swayScale +
          inspectVector.x *
            (this.state === "inspect" ? this.config.inspect.leanDistance : 0),
        y:
          basePoint.y +
          Math.cos(this.clock * this.config.sway.rate * 0.8 + this.hashAnchorPhase()) *
            this.config.sway.y *
            swayScale +
          inspectVector.y *
            (this.state === "inspect" ? this.config.inspect.leanDistance : 0),
      };
    }

    hashAnchorPhase() {
      if (!this.currentAnchorId) {
        return 0;
      }

      return Array.from(this.currentAnchorId).reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0
      ) * 0.01;
    }

    updateHeading(deltaTime) {
      const activeAnchor = this.layout.getAnchor(this.currentAnchorId);
      const inspectVector = activeAnchor?.inspectVector || { x: 1, y: 0 };
      const speed = Math.hypot(this.body.vx, this.body.vy);
      const targetVector =
        speed > 8 ? normalize({ x: this.body.vx, y: this.body.vy }) : inspectVector;
      const desiredAngle = Math.atan2(targetVector.y, targetVector.x);
      const blend = 1 - Math.pow(0.001, deltaTime);
      this.heading = lerp(this.heading, desiredAngle, blend);
    }

    updateLegs(deltaTime) {
      const isZip = this.state === "zip";
      const activeSteps = this.legs.filter((leg) => leg.step).length;
      const maxActive = isZip
        ? this.config.legStep.zipMaxActive
        : this.config.legStep.maxActive;

      // Velocity bias converts body velocity (viewport px/s) to SVG units.
      // Scale = svgSize / shellSize so the bias reads correctly in SVG space.
      const svgScale = (this.config.svgSize || 132) / (this.config.shellSize || 92);
      const velocityBias = {
        x: this.body.vx * this.config.legStep.reachBias * (isZip ? 0 : 1) * svgScale,
        y: this.body.vy * this.config.legStep.reachBias * (isZip ? 0 : 1) * svgScale,
      };
      const candidates = [];

      this.legs.forEach((leg, index) => {
        leg.cooldown = Math.max(0, leg.cooldown - deltaTime);

        // ideal is in body-relative SVG units — rest offset + velocity reach bias.
        const ideal = {
          x: leg.definition.rest.x + velocityBias.x,
          y: leg.definition.rest.y + velocityBias.y,
        };

        if (leg.step) {
          leg.step.progress = Math.min(1, leg.step.progress + deltaTime / leg.step.duration);
          const eased = easeInOutQuad(leg.step.progress);
          const lift = Math.sin(Math.PI * eased) * leg.definition.lift;
          leg.current = {
            x: lerp(leg.step.from.x, leg.step.to.x, eased),
            y: lerp(leg.step.from.y, leg.step.to.y, eased) - lift,
          };

          if (leg.step.progress >= 1) {
            leg.planted = { ...leg.step.to };
            leg.current = { ...leg.planted };
            leg.step = null;
            leg.cooldown = this.config.legStep.cooldown;
          }
          return;
        }

        leg.current = { ...leg.planted };
        const gap = distance(leg.planted, ideal);
        const threshold = isZip
          ? this.config.legStep.zipThreshold
          : this.config.legStep.threshold;

        if (isZip && gap > threshold * 2.1) {
          leg.planted = {
            x: lerp(leg.planted.x, ideal.x, this.config.legStep.zipCarry),
            y: lerp(leg.planted.y, ideal.y, this.config.legStep.zipCarry),
          };
          leg.current = { ...leg.planted };
        }

        if (gap >= threshold && leg.cooldown <= 0) {
          candidates.push({
            index,
            ideal,
            gap,
          });
        }
      });

      if (activeSteps >= maxActive || !candidates.length) {
        return;
      }

      const phaseGroup =
        this.config.legPhaseOrder[this.legPhaseCursor % this.config.legPhaseOrder.length];
      const ordered = [
        ...candidates
          .filter((candidate) => phaseGroup.includes(candidate.index))
          .sort((left, right) => right.gap - left.gap),
        ...candidates
          .filter((candidate) => !phaseGroup.includes(candidate.index))
          .sort((left, right) => right.gap - left.gap),
      ];

      ordered
        .slice(0, maxActive - activeSteps)
        .forEach((candidate) => {
          const leg = this.legs[candidate.index];
          const durationRange = isZip
            ? this.config.legStep.zipDuration
            : this.config.legStep.duration;
          leg.step = {
            from: { ...leg.planted },
            to: candidate.ideal,
            duration: this.config.randomBetween(
              durationRange[0],
              durationRange[1]
            ),
            progress: 0,
          };
        });

      this.legPhaseCursor += 1;
    }

    updateBurst(deltaTime) {
      this.burstRemaining = Math.max(0, this.burstRemaining - deltaTime);

      if (this.state === "zip") {
        if (this.burstRemaining <= 0.04) {
          this.triggerBurst(this.config.randomBetween(0.12, 0.2));
        }
        return;
      }

      if (this.state !== "inspect") {
        return;
      }

      if (this.clock < this.nextInspectBurstAt || this.burstRemaining > 0) {
        return;
      }

      if (Math.random() <= this.config.burst.inspectChance) {
        this.triggerBurst();
      }

      this.nextInspectBurstAt =
        this.clock +
        this.config.randomBetween(
          this.config.burst.cooldown[0],
          this.config.burst.cooldown[1]
        );
    }

    advanceState() {
      if (this.state === "zip") {
        const settled = this.travelPoint && distance(this.body, this.travelPoint) < 10;
        const slow = Math.hypot(this.body.vx, this.body.vy) < 48;
        if (settled && slow) {
          this.currentAnchorId = this.travelAnchorId || this.currentAnchorId;
          this.travelAnchorId = null;
          this.travelPoint = null;
          this.enterState("rest");
        }
        return;
      }

      if (this.state === "crawl") {
        const settled = this.travelPoint && distance(this.body, this.travelPoint) < 12;
        const slow = Math.hypot(this.body.vx, this.body.vy) < 42;
        if ((settled && slow) || this.stateRemaining <= 0) {
          if (this.travelAnchorId) {
            this.currentAnchorId = this.travelAnchorId;
          }
          this.travelAnchorId = null;
          this.travelPoint = null;
          this.enterState("rest");
        }
        return;
      }

      if (this.stateRemaining > 0) {
        return;
      }

      if (this.state === "rest") {
        const anchor = this.layout.getAnchor(this.currentAnchorId);
        if (anchor?.behaviors.includes("inspect")) {
          this.enterState("inspect");
          return;
        }
        this.enterState("idle");
        return;
      }

      if (this.state === "inspect") {
        this.enterState("idle");
        return;
      }

      if (this.state === "idle") {
        this.planCrawl();
        return;
      }

      this.enterState("rest");
    }

    planCrawl() {
      const anchors = this.layout.getAnchorsForSection(this.activeSectionId);
      if (!anchors.length) {
        this.enterState("rest");
        return;
      }

      if (anchors.length > 1) {
        const currentIndex = anchors.findIndex((anchor) => anchor.id === this.currentAnchorId);
        const nextAnchor = anchors[(currentIndex + 1 + anchors.length) % anchors.length];
        if (nextAnchor && nextAnchor.id !== this.currentAnchorId) {
          this.travelAnchorId = nextAnchor.id;
          this.travelPoint = nextAnchor.point;
          this.enterState("crawl");
          return;
        }
      }

      const currentAnchor = this.layout.getAnchor(this.currentAnchorId);
      if (!currentAnchor) {
        this.enterState("rest");
        return;
      }

      const crawlIndex = (this.crawlCursor.get(currentAnchor.id) || 0) % currentAnchor.crawlPoints.length;
      this.crawlCursor.set(currentAnchor.id, crawlIndex + 1);
      this.travelAnchorId = currentAnchor.id;
      this.travelPoint = currentAnchor.crawlPoints[crawlIndex];
      this.enterState("crawl");
    }

    enterState(state) {
      this.state = state;
      const [minDuration, maxDuration] = this.config.stateDurations[state];
      this.stateRemaining = this.config.randomBetween(minDuration, maxDuration);

      if (state === "zip") {
        this.triggerBurst(this.config.randomBetween(0.18, 0.28));
      }

      if (state === "inspect") {
        this.nextInspectBurstAt =
          this.clock + this.config.randomBetween(0.08, 0.42);
      }
    }

    triggerBurst(duration) {
      this.burstRemaining = Math.max(
        this.burstRemaining,
        duration ||
          this.config.randomBetween(
            this.config.burst.duration[0],
            this.config.burst.duration[1]
          )
      );
    }

    pickAnchor(sectionId, { preferDifferent = false } = {}) {
      const anchors = this.layout.getAnchorsForSection(sectionId);
      if (!anchors.length) {
        return null;
      }

      const cursor = this.sectionCursor.get(sectionId) || 0;
      let nextAnchor = anchors[cursor % anchors.length];
      this.sectionCursor.set(sectionId, cursor + 1);

      if (
        preferDifferent &&
        anchors.length > 1 &&
        nextAnchor &&
        nextAnchor.id === this.currentAnchorId
      ) {
        nextAnchor = anchors[(cursor + 1) % anchors.length];
      }

      return nextAnchor;
    }

    buildScene({ docked = false } = {}) {
      const activeAnchor = this.layout.getAnchor(this.currentAnchorId);
      const inspectVector = activeAnchor?.inspectVector || { x: 1, y: 0 };
      const movementVector =
        Math.hypot(this.body.vx, this.body.vy) > 8
          ? normalize({ x: this.body.vx, y: this.body.vy })
          : inspectVector;

      return {
        body: {
          x: this.body.x,
          y: this.body.y,
        },
        rotation: (this.heading * 180) / Math.PI * 0.32,
        opacity: docked ? 0.88 : 0.97,
        scale: this.state === "zip" ? 1.03 : 1,
        docked,
        state: docked ? "rest" : this.state,
        shellSize: this.config.shellSize,
        svgSize: this.config.svgSize,
        burst:
          !docked && this.burstRemaining > 0
            ? {
                active: true,
                intensity: Math.min(1, this.burstRemaining / 0.12),
              }
            : null,
        legs: this.legs.map((leg) => ({
          base: leg.definition.base,
          // tip is already in body-relative SVG units — use directly.
          // No subtraction needed since planted/current are SVG-local offsets.
          tip: {
            x: leg.current.x,
            y: leg.current.y,
          },
          bend: leg.definition.bend,
          lift: leg.step ? Math.sin(Math.PI * easeInOutQuad(leg.step.progress)) * leg.definition.lift : 0,
          side: leg.definition.side,
          opacity: leg.step ? 1 : 0.88,
          width: leg.step ? 1.52 : 1.34,
        })),
        thread:
          docked || this.state === "rest" || this.state === "idle" || this.state === "inspect"
            ? null
            : {
                vector: { x: -movementVector.x, y: -movementVector.y },
                length:
                  this.state === "zip"
                    ? Math.min(64, 30 + Math.hypot(this.body.vx, this.body.vy) * 0.08)
                    : 18,
                opacity: this.state === "zip" ? 0.5 : 0.24,
              },
      };
    }
  }

  globalScope.MascotController = MascotController;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MascotController;
  }
})(typeof window !== "undefined" ? window : globalThis);
