(function attachMascotInit(globalScope) {
  function initHomepageMascot(documentRef = globalScope.document) {
    const config = globalScope.MascotConfig;
    if (
      !documentRef ||
      !config ||
      !globalScope.MascotLayout ||
      !globalScope.MascotRenderer ||
      !globalScope.MascotController
    ) {
      return null;
    }

    if (!documentRef.body || !documentRef.body.classList.contains("page-home")) {
      return null;
    }

    const root = documentRef.querySelector(config.rootSelector);
    if (!root) {
      return null;
    }

    if (globalScope.__homepageMascot && root.dataset.mascotMounted === "true") {
      return globalScope.__homepageMascot;
    }

    const layout = new globalScope.MascotLayout({
      config,
      documentRef,
      windowRef: globalScope,
    });
    const renderer = new globalScope.MascotRenderer({
      config,
      documentRef,
      root,
    });
    const controller = new globalScope.MascotController({
      config,
      layout,
      renderer,
      documentRef,
      windowRef: globalScope,
    });

    root.dataset.mascotMounted = "true";
    globalScope.__homepageMascot = controller;
    controller.start();
    return controller;
  }

  function autoInit() {
    initHomepageMascot();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit, { once: true });
    } else {
      autoInit();
    }
  }

  globalScope.initHomepageMascot = initHomepageMascot;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = initHomepageMascot;
  }
})(typeof window !== "undefined" ? window : globalThis);
