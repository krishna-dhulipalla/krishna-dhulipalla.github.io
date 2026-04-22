const menuToggle = document.querySelector("[data-menu-toggle]");
const siteMenu = document.querySelector("[data-site-menu]");
const themeToggles = document.querySelectorAll("[data-theme-toggle]");
const root = document.documentElement;
const themeStorageKey = "theme";

function applyTheme(theme, { persist = true, pulse = false } = {}) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  root.dataset.theme = resolvedTheme;

  themeToggles.forEach((toggle) => {
    const label = toggle.querySelector("[data-theme-label]");
    toggle.setAttribute("aria-pressed", String(resolvedTheme === "dark"));
    toggle.setAttribute(
      "aria-label",
      resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );

    if (label) {
      label.textContent = resolvedTheme === "dark" ? "Dark" : "Light";
    }
  });

  if (persist) {
    try {
      window.localStorage.setItem(themeStorageKey, resolvedTheme);
    } catch (error) {
      // Ignore storage failures and keep the current session theme.
    }
  }

  if (pulse) {
    root.classList.remove("theme-shifting");
    void root.offsetWidth;
    root.classList.add("theme-shifting");
    window.clearTimeout(applyTheme.pulseTimer);
    applyTheme.pulseTimer = window.setTimeout(() => {
      root.classList.remove("theme-shifting");
    }, 520);
  }
}

if (menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (themeToggles.length > 0) {
  applyTheme(root.dataset.theme, { persist: false });

  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, { pulse: true });
    });
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const listenButton = document.querySelector("[data-listen-article]");
const restartButton = document.querySelector("[data-restart-article]");
const shareButton = document.querySelector("[data-share-article]");
const articleStatus = document.querySelector("[data-article-status]");
const articleVoiceSource = document.querySelector("[data-post-voice-source]");
const listenIcon = document.querySelector("[data-listen-icon]");
const listenLabel = document.querySelector("[data-listen-label]");
const shareLabel = document.querySelector("[data-share-label]");

function setArticleStatus(message) {
  if (articleStatus) {
    articleStatus.textContent = message;
  }
}

if (listenButton && articleVoiceSource) {
  const speech = window.speechSynthesis;
  let activeUtterance = null;
  let isManualCancel = false;
  const defaultStatus = articleStatus?.textContent ?? "Audio unavailable";

  function setListenState(state) {
    const resolvedState =
      state === "playing" || state === "paused" ? state : "idle";
    listenButton.dataset.state = resolvedState;

    if (listenIcon) {
      listenIcon.textContent = resolvedState === "playing" ? "||" : ">";
    }

    if (listenLabel) {
      if (resolvedState === "playing") {
        listenLabel.textContent = "Pause audio";
      } else if (resolvedState === "paused") {
        listenLabel.textContent = "Resume audio";
      } else {
        listenLabel.textContent = "Listen to article";
      }
    }
  }

  function buildUtterance() {
    const articleText = articleVoiceSource.textContent
      .replace(/\s+/g, " ")
      .trim();

    if (!articleText) {
      setArticleStatus("No article text available");
      return null;
    }

    const utterance = new window.SpeechSynthesisUtterance(articleText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setListenState("playing");
      setArticleStatus("Playing audio");
    };
    utterance.onend = () => {
      if (isManualCancel) {
        isManualCancel = false;
        return;
      }

      activeUtterance = null;
      setListenState("idle");
      setArticleStatus(defaultStatus);
    };
    utterance.onerror = () => {
      if (isManualCancel) {
        isManualCancel = false;
        return;
      }

      activeUtterance = null;
      setListenState("idle");
      setArticleStatus("Audio unavailable");
    };

    return utterance;
  }

  function startPlayback() {
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") {
      setArticleStatus("Voice unavailable in this browser");
      return;
    }

    activeUtterance = buildUtterance();

    if (!activeUtterance) {
      return;
    }

    speech.cancel();
    speech.speak(activeUtterance);
  }

  listenButton.addEventListener("click", () => {
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") {
      setArticleStatus("Voice unavailable in this browser");
      return;
    }

    if (speech.paused) {
      speech.resume();
      setListenState("playing");
      setArticleStatus("Playing audio");
      return;
    }

    if (speech.speaking) {
      speech.pause();
      setListenState("paused");
      setArticleStatus("Audio paused");
      return;
    }

    startPlayback();
  });

  if (restartButton) {
    restartButton.addEventListener("click", () => {
      if (!speech || typeof window.SpeechSynthesisUtterance !== "function") {
        setArticleStatus("Voice unavailable in this browser");
        return;
      }

      if (speech.speaking || speech.paused) {
        isManualCancel = true;
        speech.cancel();
      }

      setListenState("idle");
      setArticleStatus("Restarting audio");
      window.setTimeout(() => {
        startPlayback();
      }, 60);
    });
  }

  window.addEventListener("pagehide", () => {
    if (speech.speaking || speech.paused) {
      isManualCancel = true;
      speech.cancel();
    }
  });

  setListenState("idle");
}

if (shareButton) {
  const defaultShareLabel = shareLabel?.textContent ?? "Share";
  let shareTimer = null;

  function setShareLabel(message, duration = 1600) {
    if (!shareLabel) {
      return;
    }

    shareLabel.textContent = message;
    window.clearTimeout(shareTimer);

    if (duration > 0) {
      shareTimer = window.setTimeout(() => {
        shareLabel.textContent = defaultShareLabel;
      }, duration);
    }
  }

  shareButton.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
        setShareLabel("Shared");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareLabel("Copied");
        return;
      }

      setShareLabel("Unavailable");
    } catch (error) {
      if (error && error.name === "AbortError") {
        setShareLabel(defaultShareLabel, 0);
        return;
      }

      setShareLabel("Failed");
    }
  });
}
