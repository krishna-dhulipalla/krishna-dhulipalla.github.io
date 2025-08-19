function setThemeFromStorage() {
  if (localStorage.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function updateToggleIcon() {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = document.documentElement.classList.contains('dark')
      ? '🌞'
      : '🌙';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.theme = isDark ? 'dark' : 'light';
  updateToggleIcon();
}

setThemeFromStorage();

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    updateToggleIcon();
    toggle.addEventListener('click', toggleTheme);
  }
});
