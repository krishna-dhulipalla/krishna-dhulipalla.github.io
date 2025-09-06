// AOS
window.addEventListener("load", () =>
  AOS.init({ once: true, duration: 700, easing: "ease-out" })
);

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
menuBtn?.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));

// Theme toggle (persist in localStorage)
const themeBtn = document.getElementById("theme-toggle");
const setTheme = (isDark) => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    localStorage.theme = "dark";
  } else {
    root.classList.remove("dark");
    localStorage.theme = "light";
  }
};
// init
setTheme(
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
);
themeBtn?.addEventListener("click", () => {
  setTheme(!document.documentElement.classList.contains("dark"));
});

// Update theme button visuals
function refreshThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const isDark = document.documentElement.classList.contains("dark");
  btn.setAttribute("aria-pressed", String(isDark));
  const icon = isDark ? "🌙" : "🌞";
  const label = isDark ? "Dark" : "Light";
  btn.innerHTML = `<span class="theme-icon" aria-hidden="true">${icon}</span><span class="theme-text hidden sm:inline">${label}</span>`;
}

refreshThemeToggle();
themeBtn?.addEventListener("click", () => {
  themeBtn.classList.add("rotating");
  setTimeout(() => themeBtn.classList.remove("rotating"), 350);
  refreshThemeToggle();
});

// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Resume modal
const resumeLinks = [
  document.getElementById("resume-link"),
  document.getElementById("resume-link-m"),
].filter(Boolean);
const resumeModal = document.getElementById("resumeModal");
const closeResume = document.getElementById("closeResume");
resumeLinks.forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    resumeModal.classList.remove("hidden");
    resumeModal.classList.add("flex");
  })
);
closeResume?.addEventListener("click", () => {
  resumeModal.classList.add("hidden");
  resumeModal.classList.remove("flex");
});
resumeModal.addEventListener("click", (e) => {
  if (e.target === resumeModal) closeResume.click();
});

// Toast helper
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2400);
}
window.showToast = showToast;

// Fallback if the primary Lottie fails to load
const hero = document.getElementById("heroAnim");
const fb = document.getElementById("heroAnimFallback");
hero?.addEventListener("error", () => {
  try {
    // Attempt a remote fallback animation
    const current = hero.getAttribute("src") || "";
    if (current.startsWith("/assets/")) {
      hero.setAttribute("src", current.replace(/^\//, ""));
      return; // try relative path once
    }
    // no more remote hotlinking; just reveal fallback
  } catch (e) {
    /* noop */
  } finally {
    fb?.classList.remove("hidden");
  }
});

(function initTilt() {
  const card = document.querySelector(".tilt-card");
  if (!card) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let rect = null;
  const maxRotate = 10;
  function setFromEvent(e) {
    rect = rect || card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -2 * maxRotate;
    const ry = (px - 0.5) * 2 * maxRotate;
    card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
      2
    )}deg)`;
  }
  function reset() {
    rect = null;
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
    card.classList.remove("is-tilting");
  }
  card.addEventListener("mouseenter", () => card.classList.add("is-tilting"));
  card.addEventListener("mousemove", setFromEvent);
  card.addEventListener("mouseleave", reset);
  window.addEventListener(
    "scroll",
    () => {
      rect = null;
    },
    { passive: true }
  );
})();

// --- Filter buttons ---
const filterWrap = document.getElementById("projFilters");
const cards = Array.from(document.querySelectorAll("#projGrid .proj-card"));

filterWrap?.addEventListener("click", (e) => {
  const btn = e.target.closest(".proj-filter");
  if (!btn) return;
  filterWrap
    .querySelectorAll(".proj-filter")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
  btn.setAttribute("aria-pressed", "true");
  const key = btn.dataset.filter;
  cards.forEach((card) => {
    const cat = card.dataset.cat;
    card.style.display = key === "all" || cat === key ? "" : "none";
  });
});

// Animate ring meters on enter viewport
const meters = document.querySelectorAll(".ring-meter");
if (meters.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target;
          const target =
            parseFloat(getComputedStyle(el).getPropertyValue("--val")) || 0;
          let cur = 0;
          const step = () => {
            cur += Math.max(1, Math.round(target / 24)); // ~24 frames
            if (cur >= target) cur = target;
            el.style.setProperty("--val", cur);
            el.querySelector("span").textContent = `${cur}%`;
            if (cur < target) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  meters.forEach((m) => io.observe(m));
}

// Smooth scroll for proof links
document.querySelectorAll('a[href^="#project-"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-highlight");
      setTimeout(() => target.classList.remove("ring-highlight"), 1200);
    }
  });
});
