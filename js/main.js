const menuToggle = document.querySelector("[data-menu-toggle]");
const siteMenu = document.querySelector("[data-site-menu]");

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

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
