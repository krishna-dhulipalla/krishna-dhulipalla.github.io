beforeEach(() => {
  document.body.innerHTML = `
    <button data-menu-toggle aria-expanded="false"></button>
    <nav data-site-menu></nav>
    <span data-year></span>
  `;
  jest.resetModules();
  require("../js/main.js");
});

test("menu toggle updates expanded state and menu class", () => {
  const button = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-site-menu]");

  button.click();
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(button.getAttribute("aria-expanded")).toBe("true");

  button.click();
  expect(menu.classList.contains("is-open")).toBe(false);
  expect(button.getAttribute("aria-expanded")).toBe("false");
});

test("year placeholders are populated", () => {
  const year = document.querySelector("[data-year]").textContent;
  expect(year).toBe(String(new Date().getFullYear()));
});
