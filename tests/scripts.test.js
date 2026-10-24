beforeEach(() => {
  jest.useFakeTimers();
  document.documentElement.dataset.theme = "light";
  document.body.innerHTML = `
    <button data-menu-toggle aria-expanded="false"></button>
    <nav data-site-menu><a href="#work">Work</a></nav>
    <button data-theme-toggle aria-pressed="false">
      <span data-theme-label>Light</span>
    </button>
    <span data-year></span>
    <button data-listen-article><span data-listen-icon></span><span data-listen-label></span></button>
    <button data-restart-article>Restart</button>
    <p data-article-status>1 min audio</p>
    <div data-post-voice-source>Article text for playback.</div>
  `;
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speaking: false,
      paused: false,
      cancel: jest.fn(function () { this.speaking = false; this.paused = false; }),
      speak: jest.fn(function (utterance) { this.speaking = true; utterance.onstart(); }),
      pause: jest.fn(),
      resume: jest.fn(),
    },
  });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  window.localStorage.clear();
  jest.resetModules();
  require("../js/main.js");
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
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

test("Escape dismisses the mobile menu and restores focus", () => {
  const button = document.querySelector("[data-menu-toggle]");
  button.click();
  document.querySelector("[data-site-menu] a").focus();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(button);
});

test("menu links and outside clicks dismiss the mobile menu", () => {
  const button = document.querySelector("[data-menu-toggle]");
  button.click();
  document.querySelector("[data-site-menu] a").click();
  expect(button.getAttribute("aria-expanded")).toBe("false");
  button.click();
  document.body.click();
  expect(button.getAttribute("aria-expanded")).toBe("false");
});

test("late cancellation events cannot reset restarted article audio", () => {
  const listen = document.querySelector("[data-listen-article]");
  listen.click();
  const previous = window.speechSynthesis.speak.mock.calls[0][0];
  document.querySelector("[data-restart-article]").click();
  jest.advanceTimersByTime(60);
  previous.onerror();
  previous.onend();
  expect(listen.dataset.state).toBe("playing");
  expect(listen.getAttribute("aria-pressed")).toBe("true");
  expect(document.querySelector("[data-article-status]").textContent).toBe("Playing audio");
});

test("repeated restart clicks schedule only one playback", () => {
  const restart = document.querySelector("[data-restart-article]");
  restart.click();
  restart.click();
  restart.click();
  jest.advanceTimersByTime(60);
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
});

test("leaving the page cancels a pending audio restart", () => {
  document.querySelector("[data-restart-article]").click();
  window.dispatchEvent(new Event("pagehide"));
  jest.advanceTimersByTime(60);
  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  expect(document.querySelector("[data-listen-article]").dataset.state).toBe("idle");
  expect(document.querySelector("[data-article-status]").textContent).toBe("1 min audio");
});

test("unsupported speech synthesis reports a useful status", () => {
  window.SpeechSynthesisUtterance = undefined;
  document.querySelector("[data-listen-article]").click();
  expect(document.querySelector("[data-article-status]").textContent).toBe("Voice unavailable in this browser");
});

test("sticky header measurement does not change its own minimum height", () => {
  const header = document.createElement("header");
  header.className = "site-header";
  header.getBoundingClientRect = () => ({ height: 156 });
  document.body.prepend(header);
  document.documentElement.style.removeProperty("--header-height");
  jest.resetModules();
  require("../js/main.js");
  expect(document.documentElement.style.getPropertyValue("--sticky-header-height")).toBe("156px");
  expect(document.documentElement.style.getPropertyValue("--header-height")).toBe("");
});
