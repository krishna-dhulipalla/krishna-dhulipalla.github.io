function setViewport(width = 1280, height = 900) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
    writable: true,
  });
}

function setRect(node, { left, top, width, height }, clientRects) {
  const rect = {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };

  node.getBoundingClientRect = jest.fn(() => rect);
  node.getClientRects = jest.fn(
    () =>
      clientRects ||
      [
        {
          ...rect,
        },
      ]
  );
}

function installObservers() {
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {}

    disconnect() {}
  }

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {}

    disconnect() {}
  }

  window.IntersectionObserver = FakeIntersectionObserver;
  window.ResizeObserver = FakeResizeObserver;
}

function installMotion(reducedMotion = false) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches:
      reducedMotion && query.includes("(prefers-reduced-motion: reduce)"),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

function installAnimationFrame() {
  window.requestAnimationFrame = jest.fn(() => 1);
  window.cancelAnimationFrame = jest.fn();
}

function installRangeFallback() {
  document.createRange = jest.fn(() => ({
    selectNodeContents: jest.fn(),
    getClientRects: jest.fn(() => []),
    detach: jest.fn(),
  }));
}

function buildHomepageMarkup({ includeCurrentFocus = true } = {}) {
  document.body.className = "page-home";
  document.body.innerHTML = `
    <main>
      <section id="top" data-mascot-section="intro">
        <p data-mascot-lines="intro-copy">Intro copy line one.</p>
        ${
          includeCurrentFocus
            ? `
          <div
            data-mascot-anchor="current-focus"
            data-mascot-rest="top-left"
            data-mascot-behaviors="inspect,rest"
          >
            <p data-mascot-lines="focus-copy">Focus copy line one.</p>
          </div>
        `
            : `<p data-mascot-lines="focus-copy">Focus copy line one.</p>`
        }
        <aside
          data-mascot-anchor="intro-note"
          data-mascot-rest="top-right"
          data-mascot-behaviors="rest,idle,inspect"
        ></aside>
      </section>
      <section id="notes" data-mascot-section="notes">
        <div
          data-mascot-anchor="notes-head"
          data-mascot-rest="right"
          data-mascot-behaviors="inspect,rest"
        ></div>
      </section>
    </main>
    <div id="mascot-root" class="mascot-root" aria-hidden="true"></div>
  `;

  setRect(document.querySelector('[data-mascot-section="intro"]'), {
    left: 80,
    top: 110,
    width: 1040,
    height: 520,
  });
  setRect(document.querySelector('[data-mascot-section="notes"]'), {
    left: 80,
    top: 710,
    width: 1040,
    height: 340,
  });
  setRect(document.querySelector('[data-mascot-anchor="intro-note"]'), {
    left: 790,
    top: 150,
    width: 250,
    height: 300,
  });
  setRect(
    document.querySelector('[data-mascot-lines="intro-copy"]'),
    {
      left: 110,
      top: 175,
      width: 360,
      height: 74,
    },
    [
      {
        left: 110,
        top: 175,
        width: 348,
        height: 26,
        right: 458,
        bottom: 201,
      },
      {
        left: 110,
        top: 205,
        width: 312,
        height: 26,
        right: 422,
        bottom: 231,
      },
    ]
  );
  setRect(
    document.querySelector('[data-mascot-lines="focus-copy"]'),
    {
      left: 120,
      top: 260,
      width: 330,
      height: 60,
    },
    [
      {
        left: 120,
        top: 260,
        width: 320,
        height: 24,
        right: 440,
        bottom: 284,
      },
      {
        left: 120,
        top: 288,
        width: 280,
        height: 24,
        right: 400,
        bottom: 312,
      },
    ]
  );

  const currentFocus = document.querySelector('[data-mascot-anchor="current-focus"]');
  if (currentFocus) {
    setRect(currentFocus, {
      left: 110,
      top: 245,
      width: 360,
      height: 112,
    });
  }

  setRect(document.querySelector('[data-mascot-anchor="notes-head"]'), {
    left: 110,
    top: 760,
    width: 380,
    height: 110,
  });
}

function loadMascotModules() {
  const config = require("../js/mascot-config.js");
  const Renderer = require("../js/MascotRenderer.js");
  const Layout = require("../js/MascotLayout.js");
  const Controller = require("../js/MascotController.js");
  const init = require("../js/mascot-init.js");
  return { config, Renderer, Layout, Controller, init };
}

beforeEach(() => {
  jest.resetModules();
  document.body.className = "";
  document.body.innerHTML = "";
  delete window.__homepageMascot;
  delete window.PretextLayout;
  delete window.__pretextReady;
  installObservers();
  installAnimationFrame();
  installRangeFallback();
  installMotion(false);
  setViewport();
});

test("layout builds an anchor graph and falls back cleanly when optional anchors are missing", () => {
  buildHomepageMarkup({ includeCurrentFocus: false });
  const { config, Layout } = loadMascotModules();
  const layout = new Layout({
    config,
    documentRef: document,
    windowRef: window,
  });

  const snapshot = layout.refresh();

  expect(snapshot.pretextMode).toBe("fallback");
  expect(snapshot.anchors.map((anchor) => anchor.id)).toEqual(
    expect.arrayContaining(["intro-note", "notes-head"])
  );
  expect(snapshot.anchors.some((anchor) => anchor.id === "current-focus")).toBe(false);
  expect(layout.getAnchorsForSection("intro").length).toBe(1);
});

test("layout uses Pretext line boxes when the native module is available", () => {
  buildHomepageMarkup();
  window.PretextLayout = {
    prepareWithSegments: jest.fn(() => ({ prepared: true })),
    layoutWithLines: jest.fn(() => ({
      lineCount: 2,
      height: 52,
      lines: [
        {
          text: "Focus copy line",
          width: 216,
          start: { segmentIndex: 0, graphemeIndex: 0 },
          end: { segmentIndex: 0, graphemeIndex: 15 },
        },
        {
          text: "two",
          width: 144,
          start: { segmentIndex: 0, graphemeIndex: 16 },
          end: { segmentIndex: 0, graphemeIndex: 19 },
        },
      ],
    })),
    setLocale: jest.fn(),
  };

  const { config, Layout } = loadMascotModules();
  const layout = new Layout({
    config,
    documentRef: document,
    windowRef: window,
  });

  const snapshot = layout.refresh();
  const focusRegion = snapshot.textRegions.find((region) => region.id === "focus-copy");

  expect(snapshot.pretextMode).toBe("native");
  expect(window.PretextLayout.prepareWithSegments).toHaveBeenCalled();
  expect(window.PretextLayout.layoutWithLines).toHaveBeenCalled();
  expect(focusRegion.boxes).toHaveLength(2);
  expect(focusRegion.boxes[0].width).toBe(216);
});

test("intro anchors are prioritized toward safer whitespace and current-focus resolves outside the card", () => {
  buildHomepageMarkup();
  const { config, Layout } = loadMascotModules();
  const layout = new Layout({
    config,
    documentRef: document,
    windowRef: window,
  });

  layout.refresh();
  const introAnchors = layout.getAnchorsForSection("intro");
  const currentFocus = layout.getAnchor("current-focus");

  expect(introAnchors[0].id).toBe("intro-note");
  expect(currentFocus.point.x).toBeLessThan(110);
  expect(currentFocus.point.y).toBeLessThan(245);
  expect(currentFocus.crawlPoints.length).toBeGreaterThan(1);
  expect(currentFocus.crawlPoints[1].y).toBeLessThan(260);
});

test("homepage bootstrap docks the mascot when reduced motion is enabled", () => {
  buildHomepageMarkup();
  installMotion(true);
  const { init } = loadMascotModules();

  const controller = init(document);
  const shell = document.querySelector(".mascot-shell");

  expect(controller).not.toBeNull();
  expect(controller.isReducedMotion).toBe(true);
  expect(shell).not.toBeNull();
  expect(shell.classList.contains("is-docked")).toBe(true);
  expect(document.querySelector("#mascot-root").classList.contains("is-disabled")).toBe(false);
});

test("homepage bootstrap disables the mascot on small screens", () => {
  buildHomepageMarkup();
  setViewport(760, 900);
  const { init } = loadMascotModules();

  const controller = init(document);

  expect(controller).not.toBeNull();
  expect(controller.isDisabled).toBe(true);
  expect(document.querySelector("#mascot-root").classList.contains("is-disabled")).toBe(true);
});

test("controller starts against the available anchors without throwing", () => {
  buildHomepageMarkup();
  const { init } = loadMascotModules();

  const controller = init(document);
  const shell = document.querySelector(".mascot-shell");

  expect(controller.currentAnchorId).toBe("intro-note");
  expect(shell).not.toBeNull();
  expect(shell.style.getPropertyValue("--mascot-shell-size")).toBe("92px");
  expect(document.querySelector(".mascot-scan-line")).toBeNull();
  expect(document.querySelector(".mascot-scan-echo")).toBeNull();
});
