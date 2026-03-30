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
