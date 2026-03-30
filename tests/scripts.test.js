beforeEach(() => {
  document.documentElement.dataset.theme = "light";
  document.body.innerHTML = `
    <button data-menu-toggle aria-expanded="false"></button>
    <nav data-site-menu></nav>
    <button data-theme-toggle aria-pressed="false">
      <span data-theme-label>Light</span>
    </button>
    <span data-year></span>
  `;
  window.localStorage.clear();
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

test("theme toggle updates document theme and label", () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");

  toggle.click();
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(toggle.getAttribute("aria-pressed")).toBe("true");
  expect(label.textContent).toBe("Dark");
  expect(window.localStorage.getItem("theme")).toBe("dark");

  toggle.click();
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  expect(label.textContent).toBe("Light");
  expect(window.localStorage.getItem("theme")).toBe("light");
});
