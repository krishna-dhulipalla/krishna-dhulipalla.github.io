(function attachMascotRenderer(globalScope) {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function setAttributes(node, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
  }

  class MascotRenderer {
    constructor({ root, config, documentRef } = {}) {
      this.config = config || globalScope.MascotConfig;
      this.document =
        documentRef || (globalScope.document ? globalScope.document : null);
      this.root =
        root ||
        (this.document
          ? this.document.querySelector(this.config.rootSelector)
          : null);
      this.shell = null;
      this.sceneGroup = null;
      this.legPaths = [];
      this.threadPath = null;

      if (this.root && this.document) {
        this.mount();
      }
    }

    mount() {
      if (this.shell || !this.root || !this.document) {
        return;
      }

      this.root.textContent = "";
      this.root.classList.add("is-ready");

      const shell = this.document.createElement("div");
      shell.className = "mascot-shell is-rest";
      shell.style.setProperty("--mascot-shell-size", `${this.config.shellSize}px`);

      const svg = this.document.createElementNS(SVG_NS, "svg");
      svg.classList.add("mascot-svg");
      const svgSize = this.config.svgSize || 132;
      setAttributes(svg, {
        viewBox: `0 0 ${svgSize} ${svgSize}`,
        role: "presentation",
        "aria-hidden": "true",
      });

      const defs = this.document.createElementNS(SVG_NS, "defs");
      const gradient = this.document.createElementNS(SVG_NS, "linearGradient");
      setAttributes(gradient, {
        id: "mascot-core-gradient",
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
      });

      const stopA = this.document.createElementNS(SVG_NS, "stop");
      setAttributes(stopA, {
        offset: "0%",
        "stop-color": "var(--paper-strong)",
      });

      const stopB = this.document.createElementNS(SVG_NS, "stop");
      setAttributes(stopB, {
        offset: "100%",
        "stop-color": "rgba(78, 103, 182, 0.14)",
      });

      gradient.append(stopA, stopB);
      defs.append(gradient);
      svg.append(defs);

      const sceneGroup = this.document.createElementNS(SVG_NS, "g");
      sceneGroup.classList.add("mascot-agent");
      sceneGroup.setAttribute(
        "transform",
        `translate(${svgSize / 2} ${svgSize / 2})`
      );

      const threadPath = this.document.createElementNS(SVG_NS, "path");
      threadPath.classList.add("mascot-thread");
      sceneGroup.append(threadPath);

      const legGroup = this.document.createElementNS(SVG_NS, "g");
      legGroup.classList.add("mascot-legs");

      const legPaths = this.config.legs.map(() => {
        const path = this.document.createElementNS(SVG_NS, "path");
        path.classList.add("mascot-leg");
        legGroup.append(path);
        return path;
      });

      const bodyShadow = this.document.createElementNS(SVG_NS, "ellipse");
      bodyShadow.classList.add("mascot-shadow");
      setAttributes(bodyShadow, {
        cx: 0,
        cy: 16,
        rx: 24,
        ry: 8,
      });

      const bodyCore = this.document.createElementNS(SVG_NS, "ellipse");
      bodyCore.classList.add("mascot-body-core");
      setAttributes(bodyCore, {
        cx: 0,
        cy: 0,
        rx: this.config.body.radiusX,
        ry: this.config.body.radiusY,
      });

      const bodyRing = this.document.createElementNS(SVG_NS, "ellipse");
      bodyRing.classList.add("mascot-body-ring");
      setAttributes(bodyRing, {
        cx: 0,
        cy: 0,
        rx: this.config.body.radiusX + 4.5,
        ry: this.config.body.radiusY + 4,
      });

      const head = this.document.createElementNS(SVG_NS, "circle");
      head.classList.add("mascot-head");
      setAttributes(head, {
        cx: this.config.body.headX,
        cy: this.config.body.headY,
        r: this.config.body.headRadius,
      });

      const eyeLeft = this.document.createElementNS(SVG_NS, "circle");
      eyeLeft.classList.add("mascot-eye");
      setAttributes(eyeLeft, {
        cx: this.config.body.headX - 1.5,
        cy: this.config.body.headY - 0.45,
        r: this.config.body.eyeRadius,
      });

      const eyeRight = this.document.createElementNS(SVG_NS, "circle");
      eyeRight.classList.add("mascot-eye");
      setAttributes(eyeRight, {
        cx: this.config.body.headX + 1.55,
        cy: this.config.body.headY - 0.35,
        r: this.config.body.eyeRadius,
      });

      const eyeShineLeft = this.document.createElementNS(SVG_NS, "circle");
      eyeShineLeft.classList.add("mascot-eye-shine");
      setAttributes(eyeShineLeft, {
        cx: this.config.body.headX - 0.95,
        cy: this.config.body.headY - 1.05,
        r: 0.54,
      });

      const eyeShineRight = this.document.createElementNS(SVG_NS, "circle");
      eyeShineRight.classList.add("mascot-eye-shine");
      setAttributes(eyeShineRight, {
        cx: this.config.body.headX + 2.05,
        cy: this.config.body.headY - 0.92,
        r: 0.54,
      });

      const smile = this.document.createElementNS(SVG_NS, "path");
      smile.classList.add("mascot-smile");
      smile.setAttribute(
        "d",
        `M ${this.config.body.headX - 2.2} ${this.config.body.headY + 2.1} Q ${
          this.config.body.headX
        } ${this.config.body.headY + 3.45} ${this.config.body.headX + 2.35} ${
          this.config.body.headY + 1.95
        }`
      );

      const sensorLine = this.document.createElementNS(SVG_NS, "path");
      sensorLine.classList.add("mascot-sensor");
      sensorLine.setAttribute(
        "d",
        `M 8 -6 C 13 -10 15 -14 ${this.config.body.headX - 1} ${
          this.config.body.headY + 1
        }`
      );

      const nodeHalo = this.document.createElementNS(SVG_NS, "ellipse");
      nodeHalo.classList.add("mascot-node-halo");
      setAttributes(nodeHalo, {
        cx: -4.2,
        cy: -0.4,
        rx: 5.8,
        ry: 4.2,
      });

      const nodeCore = this.document.createElementNS(SVG_NS, "ellipse");
      nodeCore.classList.add("mascot-node-core");
      setAttributes(nodeCore, {
        cx: -4.2,
        cy: -0.4,
        rx: 2.8,
        ry: 2.2,
      });

      sceneGroup.append(
        legGroup,
        bodyShadow,
        bodyRing,
        bodyCore,
        sensorLine,
        head,
        eyeLeft,
        eyeRight,
        eyeShineLeft,
        eyeShineRight,
        smile,
        nodeHalo,
        nodeCore
      );

      svg.append(sceneGroup);
      shell.append(svg);
      this.root.append(shell);

      this.shell = shell;
      this.sceneGroup = sceneGroup;
      this.legPaths = legPaths;
      this.threadPath = threadPath;
    }

    setDisabled(disabled) {
      if (!this.root || !this.shell) {
        return;
      }

      this.root.classList.toggle("is-disabled", Boolean(disabled));
      this.shell.toggleAttribute("hidden", Boolean(disabled));
    }

    setState(state, { docked = false, thread = false, burst = false } = {}) {
      if (!this.shell) {
        return;
      }

      const knownStates = ["idle", "crawl", "inspect", "zip", "rest"];
      knownStates.forEach((name) => {
        this.shell.classList.toggle(`is-${name}`, state === name);
      });
      this.shell.classList.toggle("is-docked", docked);
      this.shell.classList.toggle("has-thread", thread);
      this.shell.classList.toggle("has-burst", burst);
      this.shell.dataset.state = state;
    }

    render(scene) {
      if (!scene || !this.shell || !this.sceneGroup) {
        return;
      }

      this.setDisabled(false);
      this.setState(scene.state || "rest", {
        docked: Boolean(scene.docked),
        thread: Boolean(scene.thread && scene.thread.opacity > 0.02),
        burst: Boolean(scene.burst && scene.burst.active),
      });
      if (scene.burst && scene.burst.active) {
        this.shell.style.setProperty(
          "--mascot-burst-intensity",
          scene.burst.intensity.toFixed(3)
        );
      } else {
        this.shell.style.removeProperty("--mascot-burst-intensity");
      }

      const shellHalfSize = (scene.shellSize || this.config.shellSize) / 2;
      const x = scene.body.x - shellHalfSize;
      const y = scene.body.y - shellHalfSize;
      this.shell.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      this.shell.style.opacity = String(scene.opacity ?? 1);

      const scale = scene.scale || 1;
      const rotation = scene.rotation || 0;
      const sceneHalfSize = (scene.svgSize || this.config.svgSize || 132) / 2;
      this.sceneGroup.setAttribute(
        "transform",
        `translate(${sceneHalfSize} ${sceneHalfSize}) rotate(${rotation.toFixed(
          2
        )}) scale(${scale.toFixed(
          3
        )})`
      );

      scene.legs.forEach((leg, index) => {
        const path = this.legPaths[index];
        if (!path) {
          return;
        }

        const dx = leg.tip.x - leg.base.x;
        const dy = leg.tip.y - leg.base.y;
        const distance = Math.hypot(dx, dy) || 1;
        const nx = (-dy / distance) * (leg.side === "left" ? -1 : 1);
        const ny = (dx / distance) * (leg.side === "left" ? -1 : 1);
        const controlX = leg.base.x + dx * 0.46 + nx * leg.bend;
        const controlY = leg.base.y + dy * 0.46 + ny * leg.bend - leg.lift * 0.5;

        path.setAttribute(
          "d",
          `M ${leg.base.x.toFixed(2)} ${leg.base.y.toFixed(2)} Q ${controlX.toFixed(
            2
          )} ${controlY.toFixed(2)} ${leg.tip.x.toFixed(2)} ${leg.tip.y.toFixed(2)}`
        );
        path.style.opacity = String(leg.opacity ?? 0.9);
        path.style.strokeWidth = String(leg.width ?? 1.35);
      });

      if (scene.thread && scene.thread.opacity > 0.02) {
        const endX = scene.thread.vector.x * scene.thread.length;
        const endY = scene.thread.vector.y * scene.thread.length;
        const controlX = endX * 0.52;
        const controlY = endY * 0.52 - 6;
        this.threadPath.setAttribute(
          "d",
          `M 0 0 Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${endX.toFixed(
            2
          )} ${endY.toFixed(2)}`
        );
        this.threadPath.style.opacity = String(scene.thread.opacity);
      } else {
        this.threadPath.removeAttribute("d");
        this.threadPath.style.opacity = "0";
      }
    }
  }

  globalScope.MascotRenderer = MascotRenderer;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MascotRenderer;
  }
})(typeof window !== "undefined" ? window : globalThis);
