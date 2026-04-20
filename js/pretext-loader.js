(function attachPretextLoader(globalScope) {
  const currentScript =
    typeof document !== "undefined" ? document.currentScript : null;
  const moduleUrl = currentScript
    ? new URL("./vendor/pretext/layout.js", currentScript.src).href
    : "./js/vendor/pretext/layout.js";

  globalScope.__pretextReady = import(moduleUrl)
    .then((module) => {
      if (typeof module.setLocale === "function") {
        try {
          module.setLocale(globalScope.navigator?.language);
        } catch (error) {
          // Keep the default locale if the browser locale is unavailable.
        }
      }

      globalScope.PretextLayout = module;
      return module;
    })
    .catch((error) => {
      globalScope.PretextLayout = null;
      return null;
    });
})(typeof window !== "undefined" ? window : globalThis);
