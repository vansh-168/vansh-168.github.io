const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

const sidebar = document.getElementById("sidebar");
const mobileToggle = document.getElementById("mobile-nav-toggle");
mobileToggle.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("is-open");
  mobileToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".sidebar nav a").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("is-open");
    mobileToggle.setAttribute("aria-expanded", "false");
  });
});
