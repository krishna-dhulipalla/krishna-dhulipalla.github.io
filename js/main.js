// AOS
window.addEventListener("load", () =>
  AOS.init({ once: true, duration: 700, easing: "ease-out" })
);

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
menuBtn?.addEventListener("click", () =>
  mobileMenu.classList.toggle("hidden")
);

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
themeBtn?.addEventListener("click", () =>
  setTheme(!document.documentElement.classList.contains("dark"))
);

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

// Project filters
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".project-card");
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) =>
      b.classList.remove("active", "bg-teal-50", "dark:bg-gray-800")
    );
    btn.classList.add("active", "bg-teal-50", "dark:bg-gray-800");
    const tag = btn.dataset.filter;
    cards.forEach((card) => {
      const show = tag === "all" || card.dataset.tags.includes(tag);
      card.style.display = show ? "block" : "none";
    });
  })
);

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
    hero.load(
      "https://assets10.lottiefiles.com/packages/lf20_q5pk6p1k.json"
    );
  } catch (e) {
    /* noop */
  } finally {
    fb?.classList.remove("hidden");
  }
});
