(function attachMascotConfig(globalScope) {
  const anchorDefinitions = [
    {
      id: "current-focus",
      selector: '[data-mascot-anchor="current-focus"]',
      sectionId: "intro",
      restEdge: "top-left",
      behaviors: ["inspect", "rest"],
      priority: 40,
      lineRegionId: "focus-copy",
      restFromLineRegion: false,
    },
    {
      id: "core-stack",
      selector: '[data-mascot-anchor="core-stack"]',
      sectionId: "intro",
      restEdge: "bottom-left",
      behaviors: ["rest"],
      priority: 20,
    },
    {
      id: "intro-note",
      selector: '[data-mascot-anchor="intro-note"]',
      sectionId: "intro",
      restEdge: "top-right",
      behaviors: ["rest", "idle", "inspect"],
      priority: 10,
    },
    {
      id: "work-head",
      selector: '[data-mascot-anchor="work-head"]',
      sectionId: "work",
      restEdge: "right",
      behaviors: ["inspect", "rest"],
    },
    {
      id: "work-sheet-1",
      selector: '[data-mascot-anchor="work-sheet-1"]',
      sectionId: "work",
      restEdge: "top-left",
      behaviors: ["rest", "inspect"],
    },
    {
      id: "work-sheet-2",
      selector: '[data-mascot-anchor="work-sheet-2"]',
      sectionId: "work",
      restEdge: "top-left",
      behaviors: ["rest", "inspect"],
    },
    {
      id: "work-sheet-3",
      selector: '[data-mascot-anchor="work-sheet-3"]',
      sectionId: "work",
      restEdge: "top-left",
      behaviors: ["rest", "inspect"],
    },
    {
      id: "work-sheet-4",
      selector: '[data-mascot-anchor="work-sheet-4"]',
      sectionId: "work",
      restEdge: "top-left",
      behaviors: ["rest", "inspect"],
    },
    {
      id: "notes-head",
      selector: '[data-mascot-anchor="notes-head"]',
      sectionId: "notes",
      restEdge: "right",
      behaviors: ["inspect", "rest"],
    },
    {
      id: "featured-note",
      selector: '[data-mascot-anchor="featured-note"]',
      sectionId: "notes",
      restEdge: "top-right",
      behaviors: ["inspect", "rest"],
    },
    {
      id: "experience-head",
      selector: '[data-mascot-anchor="experience-head"]',
      sectionId: "experience",
      restEdge: "right",
      behaviors: ["inspect", "rest"],
    },
    {
      id: "areas-head",
      selector: '[data-mascot-anchor="areas-head"]',
      sectionId: "areas",
      restEdge: "right",
      behaviors: ["inspect", "rest"],
    },
    {
      id: "contact-grid",
      selector: '[data-mascot-anchor="contact-grid"]',
      sectionId: "contact",
      restEdge: "left",
      behaviors: ["rest", "inspect"],
    },
  ];

  const textRegions = [
    {
      id: "intro-copy",
      selector: '[data-mascot-lines="intro-copy"]',
      sectionId: "intro",
    },
    {
      id: "focus-copy",
      selector: '[data-mascot-lines="focus-copy"]',
      sectionId: "intro",
    },
  ];

  const MascotConfig = {
    rootSelector: "#mascot-root",
    sectionSelector: "[data-mascot-section]",
    mobileMaxWidth: 920,
    shellSize: 92,
    svgSize: 132,
    anchorGap: 34,
    viewportPadding: 38,
    headerOffset: 104,
    dockedMargin: {
      x: 34,
      y: 32,
    },
    stateDurations: {
      idle: [2.1, 3.5],
      rest: [2.8, 4.6],
      inspect: [1.1, 1.8],
      crawl: [1.5, 2.4],
      zip: [0.6, 0.92],
    },
    spring: {
      idle: {
        stiffness: 15.5,
        damping: 0.82,
        maxSpeed: 540,
      },
      rest: {
        stiffness: 16.5,
        damping: 0.8,
        maxSpeed: 560,
      },
      inspect: {
        stiffness: 18,
        damping: 0.78,
        maxSpeed: 580,
      },
      crawl: {
        stiffness: 20,
        damping: 0.82,
        maxSpeed: 660,
      },
      zip: {
        stiffness: 28,
        damping: 0.76,
        maxSpeed: 1040,
      },
    },
    sway: {
      x: 2.4,
      y: 1.55,
      rate: 0.92,
    },
    inspect: {
      leanDistance: 2.2,
    },
    burst: {
      duration: [0.15, 0.26],
      cooldown: [2.8, 5.6],
      inspectChance: 0.58,
    },
    body: {
      radiusX: 15,
      radiusY: 10.8,
      headX: 14.5,
      headY: -9.2,
      headRadius: 5.5,
      eyeRadius: 1.5,
    },
    legs: [
      {
        base: { x: -8, y: -15 },
        rest: { x: -26, y: -25 },
        bend: 6.5,
        lift: 7,
        side: "left",
      },
      {
        base: { x: -12, y: -7 },
        rest: { x: -38, y: -12 },
        bend: 7.4,
        lift: 6.4,
        side: "left",
      },
      {
        base: { x: -12, y: 4 },
        rest: { x: -40, y: 5 },
        bend: 7.6,
        lift: 6.2,
        side: "left",
      },
      {
        base: { x: -7, y: 14 },
        rest: { x: -28, y: 20 },
        bend: 6.8,
        lift: 6.8,
        side: "left",
      },
      {
        base: { x: 7, y: 14 },
        rest: { x: 28, y: 20 },
        bend: 6.8,
        lift: 6.8,
        side: "right",
      },
      {
        base: { x: 12, y: 4 },
        rest: { x: 40, y: 5 },
        bend: 7.6,
        lift: 6.2,
        side: "right",
      },
      {
        base: { x: 12, y: -7 },
        rest: { x: 38, y: -12 },
        bend: 7.4,
        lift: 6.4,
        side: "right",
      },
      {
        base: { x: 8, y: -15 },
        rest: { x: 26, y: -25 },
        bend: 6.5,
        lift: 7,
        side: "right",
      },
    ],
    legPhaseOrder: [
      [0, 7],
      [1, 4],
      [2, 5],
      [3, 6],
    ],
    legStep: {
      threshold: 10.5,
      cooldown: 0.06,
      duration: [0.14, 0.24],
      maxActive: 2,
      reachBias: 0.04,
      zipThreshold: 6.2,
      zipDuration: [0.08, 0.14],
      zipMaxActive: 4,
      zipCarry: 0.3,
    },
    anchorDefinitions,
    textRegions,
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    randomBetween(min, max) {
      return min + Math.random() * (max - min);
    },
    parseBehaviors(value, fallback) {
      const source = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(",").map((item) => item.trim())
          : fallback || [];
      return source.filter(Boolean);
    },
  };

  globalScope.MascotConfig = MascotConfig;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MascotConfig;
  }
})(typeof window !== "undefined" ? window : globalThis);
