// ---------------------------------------------------------------
// FREELANCE SETTINGS — fill these in, then commit & push.
// Any link left as "" stays hidden on the site (no broken links).
// ---------------------------------------------------------------
const SITE_CONFIG = {
  upwork: "",    // e.g. "https://www.upwork.com/freelancers/~0123abcd"
  fiverr: "",    // e.g. "https://www.fiverr.com/yourname"
  linkedin: "",  // e.g. "https://www.linkedin.com/in/yourname/"
  // ---- Contact form delivery (first one that is filled in wins) ----
  // 1) Web3Forms (recommended, free 250 messages/month): go to
  //    https://web3forms.com, enter your email, and paste the Access Key
  //    they email you here. The key is safe to publish.
  web3formsKey: "81195061-55d2-49dc-a29b-616d76e39ff6",
  // 2) Formspree (free 50 messages/month): create a form at formspree.io
  //    and paste its endpoint, e.g. "https://formspree.io/f/abcdwxyz".
  formEndpoint: "",
  // 3) If both are empty, FormSubmit is used (no signup, but it has
  //    outages; the first message sends you an "Activate Form" email).
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

function setStatus(msg, kind, mailto) {
  statusEl.textContent = msg;
  if (mailto) {
    const a = document.createElement("a");
    a.href = `mailto:${mailto}`;
    a.textContent = mailto;
    statusEl.append(" ", a);
  }
  statusEl.dataset.kind = kind || "";
}

// Works out where to send the message and adds the fields that
// service needs. Returns the URL to POST to.
function prepareDelivery(data, address) {
  const subject = `New freelance enquiry: ${data.get("service")} — from ${data.get("name")}`;
  if (SITE_CONFIG.web3formsKey) {
    data.append("access_key", SITE_CONFIG.web3formsKey);
    data.append("subject", subject);
    data.append("from_name", "Portfolio contact form");
    return "https://api.web3forms.com/submit";
  }
  if (SITE_CONFIG.formEndpoint) {
    data.append("_subject", subject);
    return SITE_CONFIG.formEndpoint;
  }
  data.append("_subject", subject);
  data.append("_template", "table");
  return `https://formsubmit.co/ajax/${address}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const data = new FormData(form);
  if (data.get("_honey")) return; // bot filled the hidden field

  const address = `${EMAIL_PARTS.u}@${EMAIL_PARTS.d}`;
  const endpoint = prepareDelivery(data, address);

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  setStatus("Sending…");
  // Don't leave visitors waiting if the form service is slow or down.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    // Some services report failures as success: false / "false" with HTTP 200.
    if (!res.ok || json.success === false || json.success === "false") {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
    form.reset();
    setStatus("Thanks! Your message has been sent. I'll get back to you soon.", "ok");
  } catch (err) {
    console.error("Contact form error:", err);
    setStatus("Sorry, the form couldn't send right now. Your message is still here. Please email me at", "error", address);
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
});
