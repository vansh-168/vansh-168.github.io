// ---------------------------------------------------------------
// FREELANCE SETTINGS — fill these in, then commit & push.
// Any link left as "" stays hidden on the site (no broken links).
// ---------------------------------------------------------------
const SITE_CONFIG = {
  upwork: "",    // e.g. "https://www.upwork.com/freelancers/~0123abcd"
  fiverr: "",    // e.g. "https://www.fiverr.com/yourname"
  linkedin: "",  // e.g. "https://www.linkedin.com/in/yourname/"
  // Contact form delivery. Leave "" to use FormSubmit (free, no signup),
  // which emails each message straight to the address in EMAIL_PARTS.
  // The very first message triggers a one-time "Activate Form" email from
  // FormSubmit — click it and every message after that is delivered.
  // After activating, FormSubmit gives you a random-string alias; paste
  // "https://formsubmit.co/ajax/<that-alias>" here to keep your address
  // out of the request entirely. A Formspree endpoint also works here.
  formEndpoint: "",
};
const EMAIL_PARTS = { u: "vanshtyagi5955", d: "gmail.com" };

const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  const set = root.getAttribute("data-theme");
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const themeColorMeta = document.querySelector('meta[name="theme-color"]');
function syncThemeColor() {
  if (themeColorMeta) themeColorMeta.content = getComputedStyle(root).getPropertyValue("--paper").trim();
}
syncThemeColor();

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
  syncThemeColor();
});

const header = document.getElementById("site-header");
const mobileToggle = document.getElementById("mobile-nav-toggle");
function closeMenu() {
  header.classList.remove("is-open");
  mobileToggle.setAttribute("aria-expanded", "false");
}
mobileToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  mobileToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll("#site-nav a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

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

// Show profile links only once a URL is configured above.
document.querySelectorAll("[data-link]").forEach((el) => {
  const url = SITE_CONFIG[el.dataset.link];
  if (!url) return;
  el.querySelector("a").href = url;
  el.hidden = false;
});

// Contact form: sends the message directly (no email app needed).
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.dataset.kind = kind || "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const data = new FormData(form);
  if (data.get("_honey")) return; // bot filled the hidden field

  // Extra fields FormSubmit uses to format the email it sends you.
  data.append("_subject", `New freelance enquiry: ${data.get("service")} — from ${data.get("name")}`);
  data.append("_template", "table");

  const endpoint =
    SITE_CONFIG.formEndpoint || `https://formsubmit.co/ajax/${EMAIL_PARTS.u}@${EMAIL_PARTS.d}`;
  const address = `${EMAIL_PARTS.u}@${EMAIL_PARTS.d}`;

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  setStatus("Sending…");
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    // FormSubmit reports failures as success: "false" (a string) with HTTP 200.
    if (!res.ok || json.success === false || json.success === "false") {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
    form.reset();
    setStatus("Thanks! Your message has been sent. I'll get back to you soon.", "ok");
  } catch (err) {
    console.error("Contact form error:", err);
    setStatus(`Sorry, that didn't go through. Please email me at ${address}.`, "error");
  } finally {
    button.disabled = false;
  }
});
