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

// Emails are kept out of the raw HTML (data-u/data-d parts) and only
// assembled into a real mailto: link here, so plain-text scrapers of
// the page source never see a harvestable address.
document.querySelectorAll(".obf-email").forEach((el) => {
  const address = `${el.dataset.u}@${el.dataset.d}`;
  const link = document.createElement("a");
  link.href = `mailto:${address}`;
  link.textContent = address;
  el.replaceWith(link);
});
