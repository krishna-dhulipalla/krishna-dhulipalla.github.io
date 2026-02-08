// AOS
window.addEventListener("load", () =>
  AOS.init({ once: true, duration: 700, easing: "ease-out" }),
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
      window.matchMedia("(prefers-color-scheme: dark)").matches),
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

// --- Filter buttons ---
const filterWrap = document.getElementById("projFilters");
const cards = Array.from(
  document.querySelectorAll("#projGrid .spotlight-card"),
);

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

// Spotlight Hover Effect
const spotlightCards = document.querySelectorAll(".spotlight-card");
spotlightCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  });
});

// Lightbox Logic
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");

function openImageModal(src) {
  if (imageModal && modalImg) {
    modalImg.src = src;
    imageModal.classList.remove("hidden");
    imageModal.classList.add("flex");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
}

function closeImageModal() {
  if (imageModal) {
    imageModal.classList.add("hidden");
    imageModal.classList.remove("flex");
    document.body.style.overflow = ""; // Restore scrolling
  }
}

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    imageModal &&
    !imageModal.classList.contains("hidden")
  ) {
    closeImageModal();
  }
});

// Expose to window for inline onclick handlers
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
