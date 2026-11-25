/* samlewis.fyi renderer. Reads content.json and draws the whole one-page site.
   The editor at /admin loads this same file inside a frame with ?edit=1 and calls Site.mount() itself. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const BGS = ["sky", "mint", "lilac", "cream", "ink"];

let C = null;            // content
let O = { edit: false }; // options
let resolve = s => s;
const srcOf = x => typeof x === "string" ? x : (x && x.src) || "";
const capOf = x => (x && typeof x === "object" && x.caption) || "";
const R = x => resolve(srcOf(x));
const safeUrl = u => { u = String(u || "").trim(); return /^(https?:|mailto:|tel:|#|\/|[a-z0-9._-]+\.html?($|[#?]))/i.test(u) ? u : "#"; };
const ext = u => /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : "";

/* text helpers: data-path lets the editor find and edit any piece of text */
const T = (tag, path, val, cls = "", attrs = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-path="${path}"${attrs}>${esc(val)}</${tag}>`;
const P = (path, arr, cls = "prose") => `<div class="${cls}" data-paras="${path}">${(arr || []).map(p => `<p>${esc(p)}</p>`).join("")}</div>`;
const IMG = (path, x, cls = "", extra = "", natural = false) => {
  const s = R(x); if (!s && !O.edit) return "";
  const w = x && x.w ? ` width="${x.w}" height="${x.h}"` : "";
  const st = [];
  if (x && x.w && x.h && x.h > x.w * 1.15) st.push("object-position:50% 0");
  if (natural && x && x.w) st.push(`max-width:min(100%,${x.dw || x.w}px)`);
  if (x && x.size > 0 && x.size < 100) st.push(`width:${Math.round(x.size)}%`);
  return `<img${cls ? ` class="${cls}"` : ""} src="${esc(s)}" alt="${esc(capOf(x))}"${w}${st.length ? ` style="${st.join(";")}"` : ""} data-img="${path}" decoding="async"${extra}>`;
};
const ICONS = {
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5c0-1.2-.02-2.73-1.66-2.73-1.67 0-1.92 1.3-1.92 2.64V21h-4z"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5zm2.2.5 7.8 6.1L19.8 6zM20 7.8l-7.4 5.8a1 1 0 0 1-1.2 0L4 7.8V18h16z"/></svg>',
};
function socials(cls) {
  const s = C.site, out = [];
  if (s.linkedin) out.push(`<a class="${cls}" href="${esc(safeUrl(s.linkedin))}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICONS.linkedin}</a>`);
  if (s.email) out.push(`<a class="${cls}" href="mailto:${esc(s.email)}" aria-label="Email ${esc(s.email)}">${ICONS.email}</a>`);
  return out.join("");
}
const projById = id => C.projects.find(p => p.id === id);
const projIdx = id => C.projects.findIndex(p => p.id === id);
const thumbOf = p => p.thumb || (p.images && p.images[0] && p.images[0].src) || (p.video && p.video.poster) || "";

/* ---------- section types ---------- */
const S = {};
S.hero = (s, i) => `
  <div class="wrap">
    ${s.headline || O.edit ? `<h1 class="display hero-title"><span class="fit" data-path="sections.${i}.headline">${esc(s.headline)}</span></h1>` : ""}
    <figure class="hero-media rv">${IMG(`sections.${i}.image`, s.image, "", ' fetchpriority="high"')}
      ${s.caption || O.edit ? T("p", `sections.${i}.caption`, s.caption, "hero-caption") : ""}</figure>
  </div>`;

S.feature = (s, i) => `
  <div class="wrap feature${s.imageSide === "right" ? " right" : ""}">
    <figure class="feature-media rv">${IMG(`sections.${i}.image`, s.image, "zoom", ' fetchpriority="high"')}</figure>
    <div class="feature-copy rv">
      ${s.kicker || O.edit ? T("p", `sections.${i}.kicker`, s.kicker, "kicker") : ""}
      ${s.headline || O.edit ? T("h2", `sections.${i}.headline`, s.headline, "display feature-title") : ""}
      ${s.line || O.edit ? T("p", `sections.${i}.line`, s.line, "display feature-line") : ""}
      ${P(`sections.${i}.paragraphs`, s.paragraphs, "prose feature-text")}
      ${buttons(s.buttons, `sections.${i}.buttons`)}
    </div>
  </div>`;

S.split = (s, i) => `
  <div class="wrap split${s.imageSide === "right" ? " right" : ""}">
    <figure class="split-media rv">${IMG(`sections.${i}.image`, s.image, "zoom")}</figure>
    <div class="rv">
      ${T(i === firstIdx() ? "h1" : "h2", `sections.${i}.headline`, s.headline, "display h2")}
      ${s.subheadline || O.edit && s.subheadline !== undefined ? T("p", `sections.${i}.subheadline`, s.subheadline, "display h3 split-sub") : ""}
      <div class="cols lede">${(s.columns || []).map((c, k) => T("p", `sections.${i}.columns.${k}`, c)).join("")}</div>
      ${buttons(s.buttons, `sections.${i}.buttons`)}
    </div>
  </div>`;

const firstIdx = () => { const v = C.sections.findIndex(x => O.edit || !x.hidden); return v; };
function buttons(list, path) {
  if (!list || !list.length) return "";
  return `<div class="btns">${list.map((b, k) => `<a class="btn${k ? " ghost" : ""}" href="${esc(safeUrl(b.link))}"${ext(b.link)} data-path="${path}.${k}.label">${esc(b.label)}</a>`).join("")}</div>`;
}
function shead(s, i) {
  return `<div class="shead rv"><div>${s.kicker || O.edit && s.kicker !== undefined ? T("p", `sections.${i}.kicker`, s.kicker, "kicker") : ""}${T("h2", `sections.${i}.headline`, s.headline, "display h2")}</div>
    ${s.intro || O.edit ? T("p", `sections.${i}.intro`, s.intro, "lede") : ""}</div>`;
}

S.featured = (s, i) => `
  <div class="wrap">${shead(s, i)}
    <div class="feat">${(s.items || []).map((it, k) => {
      const p = projById(it.project); if (!p && !O.edit) return "";
      const base = `sections.${i}.items.${k}`;
      return `<a class="card rv" href="#work/${esc(it.project)}" data-project="${esc(it.project)}" data-list="sections.${i}.items" data-idx="${k}">
        <span class="card-media">${it.tag ? T("span", `${base}.tag`, it.tag, "tag") : ""}${IMG(`${base}.image`, it.image || thumbOf(p || {}), "", ' loading="lazy"')}</span>
        ${T("span", `${base}.title`, it.title || (p && p.cardTitle), "card-title")}
        <span class="card-meta"><span data-path="${base}.desc">${esc(it.desc)}</span> <span class="arrow" aria-hidden="true">→</span></span></a>`;
    }).join("")}</div>
  </div>`;

function card(id, list, k) {
  const p = projById(id); if (!p) return "";
  const n = projIdx(id), q = p.quote || p.cardQuote;
  const tp = p.thumb ? "thumb" : p.images && p.images[0] ? "images.0" : p.video && p.video.poster ? "video.poster" : "";
  const media = tp ? IMG(`projects.${n}.${tp}`, getPath(p, tp), "", ' loading="lazy"') : `<span class="card-quote">${esc(q || p.title)}</span>`;
  return `<a class="card rv" href="#work/${esc(p.id)}" data-project="${esc(p.id)}"${list ? ` data-list="${list}" data-idx="${k}"` : ""}>
    <span class="card-media">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}${media}</span>
    <span class="card-title"><span data-path="projects.${n}.cardTitle">${esc(p.cardTitle || p.title)}</span> <span class="arrow" aria-hidden="true">→</span></span>
    <span class="card-meta" data-path="projects.${n}.meta">${esc(p.meta)}</span>
    ${q ? `<span class="card-q">“${esc(q.replace(/^“|”$/g, ""))}”</span>` : ""}</a>`;
}
const getPath = (o, path) => path.split(".").reduce((a, k) => a == null ? a : a[k], o);

S.projects = (s, i) => `
  <div class="wrap">${shead(s, i)}
    <div class="grid">${(s.projects || []).map((id, k) => card(id, `sections.${i}.projects`, k)).join("")}</div>
  </div>`;

S.tabs = (s, i) => {
  const gs = s.groups || [];
  return `
  <div class="wrap">${shead(s, i)}
    <div class="tabbar rv" role="tablist" aria-label="${esc(s.headline)}">${gs.map((g, k) => `<button role="tab" id="tab-${esc(s.id)}-${k}" aria-controls="panel-${esc(s.id)}-${k}" aria-selected="${k === 0}" tabindex="${k === 0 ? 0 : -1}" data-tab-btn="${k}"><span data-path="sections.${i}.groups.${k}.name">${esc(g.name)}</span> <sup>${(g.projects || []).filter(projById).length}</sup></button>`).join("")}</div>
    ${gs.map((g, k) => `<div class="tabpanel" role="tabpanel" id="panel-${esc(s.id)}-${k}" aria-labelledby="tab-${esc(s.id)}-${k}" data-group="${esc(g.id || "")}"${k ? " hidden" : ""}>
      ${g.intro || O.edit ? T("p", `sections.${i}.groups.${k}.intro`, g.intro, "lede tab-intro") : ""}
      <div class="grid">${(g.projects || []).map((id, j) => card(id, `sections.${i}.groups.${k}.projects`, j)).join("")}</div></div>`).join("")}
  </div>`;
};

S.ticker = (s, i) => {
  const items = (s.items || []).map(x => typeof x === "string" ? { name: x } : x).filter(x => x && (x.name || srcOf(x.logo)));
  const run = items.map(x => `<b class="tk">${srcOf(x.logo) ? `<img src="${esc(R(x.logo))}" alt="" loading="lazy" decoding="async">` : `<span>${esc(x.name)}</span>`}<i aria-hidden="true">✦</i></b>`).join("");
  return `${s.label || O.edit ? T("p", `sections.${i}.label`, s.label, "kicker ticker-label wrap") : ""}
    <div class="ticker${s.mono ? " mono" : ""}" style="--dur:${Math.max(10, Number(s.duration) || 40)}s"><p class="sr-only">${esc(items.map(x => x.name).join(", "))}</p>
      <div class="ticker-track" aria-hidden="true"><div class="ticker-run">${run}</div><div class="ticker-run">${run}</div></div></div>`;
};

S.text = (s, i) => `
  <div class="wrap textsec">
    ${T("h2", `sections.${i}.headline`, s.headline, "display h2 rv")}
    <div class="rv">${P(`sections.${i}.paragraphs`, s.paragraphs)}
      ${(s.links || []).length ? `<p class="proj-links">${s.links.map((l, k) => `<a class="textlink" href="${esc(safeUrl(l.link))}"${ext(l.link)} data-path="sections.${i}.links.${k}.label">${esc(l.label)}</a>`).join("")}</p>` : ""}</div>
  </div>`;

S.curved = (s, i) => `
  <div class="curve-wrap" aria-label="${esc(s.text)}" role="img">
    <svg class="curve-svg" viewBox="0 0 1600 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><path id="curve-${i}" d="M -300 430 Q 800 -170 1900 430"/></defs>
      <text><textPath href="#curve-${i}" data-curve="${i}" startOffset="0"></textPath></text>
    </svg>
  </div>
  ${s.showSocial ? `<div class="socials">${socials("social")}</div>` : ""}`;

S.cv = (s, i) => `
  <div class="wrap">
    <div class="shead rv">${T("h2", `sections.${i}.headline`, s.headline, "display h2")}</div>
    ${s.intro || O.edit ? T("p", `sections.${i}.intro`, s.intro, "lede cv-intro rv") : ""}
    <div class="jobs">${(s.jobs || []).map((j, k) => `<div class="job rv">
      ${T("div", `sections.${i}.jobs.${k}.dates`, j.dates, "job-dates")}
      <div>${T("h3", `sections.${i}.jobs.${k}.company`, j.company, "job-co")}${T("p", `sections.${i}.jobs.${k}.role`, j.role, "job-role")}</div>
      <ul data-paras="sections.${i}.jobs.${k}.points" data-list>${(j.points || []).map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>`).join("")}</div>
    ${(s.education || []).length ? `<div class="edu rv">${T("p", `sections.${i}.educationTitle`, s.educationTitle, "kicker")}
      ${s.education.map((e, k) => `<div class="edu-row">${T("div", `sections.${i}.education.${k}.label`, e.label)}${T("div", `sections.${i}.education.${k}.place`, e.place)}${T("div", `sections.${i}.education.${k}.detail`, e.detail)}</div>`).join("")}</div>` : ""}
  </div>`;

S.contact = (s, i) => `
  <div class="wrap contact">
    <div class="rv">${T("h2", `sections.${i}.headline`, s.headline, "display h2")}
      ${T("p", `sections.${i}.text`, s.text, "lede")}
      <a class="bigmail" href="mailto:${esc(C.site.email)}">${esc(C.site.email)}</a>
      ${C.site.linkedin ? `<p style="margin-top:20px"><a class="textlink" href="${esc(safeUrl(C.site.linkedin))}" target="_blank" rel="noopener">Find me on LinkedIn →</a></p>` : ""}
    </div>
    ${s.showForm ? `<form class="form rv" data-contact>
      <label>Name<input name="name" autocomplete="name" required></label>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Message<textarea name="message" required></textarea></label>
      <button class="btn" type="submit">Send message</button>
    </form>` : ""}
  </div>`;

S.gallery = (s, i) => `
  <div class="wrap">${shead(s, i)}
    <div class="gal">${(s.images || []).map((im, k) => `<figure class="rv" style="--ar:${im.w && im.h ? (im.w / im.h).toFixed(3) : 1}">${IMG(`sections.${i}.images.${k}`, im, "zoom", ' loading="lazy"')}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ""}</figure>`).join("")}</div>
  </div>`;

S.quote = (s, i) => `
  <div class="wrap rv">${T("blockquote", `sections.${i}.quote`, s.quote, "display bigquote")}
    ${s.by || O.edit ? T("p", `sections.${i}.by`, s.by, "bigquote-by") : ""}</div>`;

S.cta = (s, i) => `
  <div class="wrap cta rv">${T("h2", `sections.${i}.headline`, s.headline, "display h2")}
    ${T("p", `sections.${i}.text`, s.text, "lede")}${buttons(s.buttons, `sections.${i}.buttons`)}</div>`;

/* ---------- free blocks (any section can hold extra text, images, buttons) ---------- */
S.custom = () => "";
function blockHTML(b, path) {
  const cls = `blk a-${["left", "center", "right"].includes(b.align) ? b.align : "left"} w-${["narrow", "wide", "full"].includes(b.width) ? b.width : "wide"}`;
  let inner = "";
  switch (b.type) {
    case "heading": inner = T("h2", `${path}.text`, b.text, "display h2"); break;
    case "subheading": inner = T("h3", `${path}.text`, b.text, "display h3"); break;
    case "text": inner = P(`${path}.paragraphs`, b.paragraphs, "prose lede"); break;
    case "quote": inner = T("blockquote", `${path}.text`, b.text, "display bigquote") + (b.by || O.edit ? T("p", `${path}.by`, b.by, "bigquote-by") : ""); break;
    case "button": inner = `<a class="btn" href="${esc(safeUrl(b.link))}"${ext(b.link)} data-path="${path}.label">${esc(b.label)}</a>`; break;
    case "image": inner = `<figure>${IMG(`${path}.image`, b.image, "zoom", ' loading="lazy"', b.width !== "full")}${b.image && b.image.caption || O.edit ? T("figcaption", `${path}.image.caption`, b.image && b.image.caption || "") : ""}</figure>`; break;
    case "spacer": inner = `<div class="spacer"${O.edit ? ' data-ph="Space"' : ""}></div>`; break;
    default: return "";
  }
  return `<div class="${cls} rv" data-block="${path}">${inner}</div>`;
}
function blocks(s, i) {
  const bs = s.blocks || [];
  if (!bs.length && !O.edit) return "";
  return `<div class="wrap blocks" data-blocks="sections.${i}.blocks">${bs.map((b, k) => blockHTML(b, `sections.${i}.blocks.${k}`)).join("")}</div>`;
}

/* ---------- page ---------- */
function visibleSections() { return C.sections.map((s, i) => [s, i]).filter(([s]) => O.edit || !s.hidden); }

function render() {
  const s = C.site;
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(s.colors || {})) root.setProperty("--" + k, v);
  if (!O.edit) {
    document.title = s.title;
    const md = $('meta[name="description"]'); if (md) md.content = s.description;
  }
  const nav = visibleSections().filter(([x]) => x.navLabel && !x.hidden);
  const first = visibleSections()[0];
  const hasContact = visibleSections().some(([x]) => x.type === "contact" && !x.hidden);
  const ann = s.announcement && s.announcement.enabled && s.announcement.text
    ? `<div class="announce" data-path="site.announcement.text">${s.announcement.link ? `<a href="${esc(safeUrl(s.announcement.link))}">${esc(s.announcement.text)}</a>` : esc(s.announcement.text)}</div>` : "";
  const body = visibleSections().map(([x, i]) => {
    const fn = S[x.type]; if (!fn) return "";
    return `<section id="${esc(x.id)}" class="sec t-${esc(x.type)} bg-${BGS.includes(x.bg) ? x.bg : "cream"}${x.hidden ? " is-hidden" : ""}" data-section="${i}">${fn(x, i)}${blocks(x, i)}</section>`;
  }).join("");
  $("#app").innerHTML = `${ann}
    <header class="header" id="top">
      <div class="wrap">
        <a class="logo" href="#${first ? esc(first[0].id) : "top"}" data-path="site.logoText">${esc(s.logoText)}</a>
        <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
        <nav class="nav" id="nav" aria-label="Sections">${nav.map(([x]) => `<a href="#${esc(x.id)}">${esc(x.navLabel)}</a>`).join("")}</nav>
      </div>
    </header>
    <main id="main">${body}</main>
    <footer class="footer bg-ink">
      <div class="wrap">
        <div class="footer-top">${T("p", "site.footerTitle", s.footerTitle, "footer-title")}
          ${hasContact ? `<a class="footer-top-link" href="#top">Back to top ↑</a>` : `<a class="footer-mail" href="mailto:${esc(s.email)}">${esc(s.email)}</a>`}</div>
        <div class="footer-bottom">${T("p", "site.footerNote", s.footerNote, "", ' style="margin:0"')}<div class="footer-icons">${socials("")}</div></div>
      </div>
    </footer>`;
  wire();
}

/* ---------- behaviour ---------- */
let curveRAF = 0, io = null, spy = null;
function wire() {
  refit();
  startCurves();
  // header colour follows the section under it
  headerColour();
  // reveal
  if (io) io.disconnect();
  if (O.edit || reduced || !("IntersectionObserver" in window)) document.body.classList.add("no-anim");
  else {
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .05 });
    $$(".rv").forEach(el => io.observe(el));
  }
  // scrollspy
  if (spy) spy.disconnect();
  const links = $$(".nav a");
  if ("IntersectionObserver" in window && links.length) {
    spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach(s => spy.observe(s));
  }
  const burger = $(".burger");
  if (burger) burger.onclick = () => { const o = document.body.classList.toggle("menu-open"); burger.setAttribute("aria-expanded", o); };
  $$(".nav a").forEach(a => a.addEventListener("click", () => { document.body.classList.remove("menu-open"); burger && burger.setAttribute("aria-expanded", "false"); }));
  $$(".tabbar").forEach(bar => {
    const sec = bar.closest("section"), btns = $$("[data-tab-btn]", bar);
    btns.forEach((b, k) => {
      b.onclick = e => { if (O.edit && e.target.closest("[data-path]")) return; showTab(sec.id, k); };
      b.onkeydown = e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); showTab(sec.id, (k + d + btns.length) % btns.length, true); }
      };
    });
    if (tabState[sec.id] != null) showTab(sec.id, tabState[sec.id]);
  });
  const f = $("[data-contact]");
  if (f) f.onsubmit = e => {
    e.preventDefault(); if (O.edit) return;
    const d = new FormData(f);
    const body = `${d.get("message")}\n\n${d.get("name")}\n${d.get("email")}`;
    location.href = `mailto:${C.site.email}?subject=${encodeURIComponent("Hello from " + d.get("name"))}&body=${encodeURIComponent(body)}`;
  };
}

function showTab(secId, k, focus) {
  const sec = document.getElementById(secId); if (!sec) return;
  const btns = [...sec.querySelectorAll("[data-tab-btn]")], panels = [...sec.querySelectorAll(".tabpanel")];
  if (!btns[k]) return;
  btns.forEach((b, j) => { b.setAttribute("aria-selected", j === k); b.tabIndex = j === k ? 0 : -1; });
  panels.forEach((p, j) => { p.hidden = j !== k; if (j === k) p.querySelectorAll(".rv").forEach(x => x.classList.add("in")); });
  if (focus) btns[k].focus();
  tabState[secId] = k;
}
const tabState = {};
function headerColour() {
  const h = $(".header"); if (!h) return;
  const secs = $$("main > section");
  const run = () => {
    const y = h.getBoundingClientRect().bottom;
    let bg = null;
    for (const s of secs) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { bg = getComputedStyle(s).backgroundColor; break; } }
    if (!bg && secs[0]) bg = getComputedStyle(secs[0]).backgroundColor;
    if (bg) h.style.setProperty("--header-bg", bg);
    h.classList.toggle("scrolled", scrollY > 10);
  };
  run();
  window.removeEventListener("scroll", headerColour._r);
  headerColour._r = () => requestAnimationFrame(run);
  window.addEventListener("scroll", headerColour._r, { passive: true });
}

function refit() {
  $$(".fit").forEach(el => {
    const box = el.parentElement.getBoundingClientRect().width;
    el.style.fontSize = "100px";
    const w = el.scrollWidth || 1;
    const max = Math.max(80, innerHeight * .36);
    el.style.fontSize = Math.min(max, Math.max(36, 100 * box / w * .98)) + "px";
  });
}

function startCurves() {
  cancelAnimationFrame(curveRAF);
  const items = $$("[data-curve]").map(tp => {
    const s = C.sections[+tp.dataset.curve];
    const unit = (s.text || "").trim() + " ✦ ";
    tp.textContent = unit;
    let len = 0; try { len = tp.getComputedTextLength(); } catch (e) {}
    if (!len) len = unit.length * 60;
    const path = tp.ownerDocument.getElementById(tp.getAttribute("href").slice(1));
    let pl = 2600; try { pl = path.getTotalLength(); } catch (e) {}
    tp.textContent = unit.repeat(Math.ceil(pl / len) + 2);
    return { tp, len, speed: Number(s.speed) || 40, off: 0 };
  });
  if (!items.length) return;
  let last = performance.now();
  const step = now => {
    const dt = Math.min(64, now - last) / 1000; last = now;
    for (const it of items) {
      if (!reduced) it.off = (it.off + it.speed * dt) % it.len;
      it.tp.setAttribute("startOffset", (it.off - it.len).toFixed(1));
    }
    if (!reduced) curveRAF = requestAnimationFrame(step);
  };
  curveRAF = requestAnimationFrame(step);
}

/* ---------- project pages ---------- */
function embedURL(u) {
  u = String(u || "").trim(); if (!u) return "";
  let m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(u);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return "";
}
function projectOrder() {
  const seen = new Set(), list = [];
  for (const s of C.sections) {
    if (s.hidden && !O.edit) continue;
    const ids = s.type === "projects" ? s.projects : s.type === "tabs" ? (s.groups || []).flatMap(g => g.projects || []) : s.type === "featured" ? (s.items || []).map(x => x.project) : [];
    for (const id of ids || []) if (!seen.has(id) && projById(id)) { seen.add(id); list.push(id); }
  }
  for (const p of C.projects) if (!seen.has(p.id) && O.edit) list.push(p.id);
  return list;
}
function sectionOf(id) {
  for (const s of C.sections) {
    if (s.hidden && !O.edit) continue;
    if (s.type === "projects" && (s.projects || []).includes(id)) return { label: s.headline, bg: s.bg, anchor: s.id };
    if (s.type === "tabs") { const k = (s.groups || []).findIndex(g => (g.projects || []).includes(id)); if (k >= 0) return { label: s.groups[k].name, bg: s.bg, anchor: s.id, tab: k }; }
  }
  return null;
}

function projectHTML(p) {
  const n = projIdx(p.id), B = `projects.${n}`;
  const imgs = p.images || [];
  const plain = imgs.map((im, k) => [im, k]).filter(([im]) => !im.heading && !im.text);
  const special = imgs.map((im, k) => [im, k]).filter(([im]) => im.heading || im.text);
  const fig = ([im, k], lazy = true) => `<figure style="--ar:${im.w && im.h ? (im.w / im.h).toFixed(3) : 1}">${IMG(`${B}.images.${k}`, im, "zoom", lazy ? ' loading="lazy"' : "", true)}${im.caption ? T("figcaption", `${B}.images.${k}.caption`, im.caption) : ""}</figure>`;
  const emb = embedURL(p.embed);
  const vid = emb ? `<figure><div class="embed"><iframe src="${esc(emb)}" title="${esc(p.embedCaption || p.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${p.embedCaption || O.edit ? T("figcaption", `${B}.embedCaption`, p.embedCaption || "") : ""}</figure>`
    : p.video && p.video.src ? `<figure><div class="vframe"><video controls playsinline preload="none" poster="${esc(resolve(p.video.poster || ""))}" aria-label="${esc(p.video.caption)}"><source src="${esc(resolve(p.video.src))}" type="video/mp4"></video></div>${p.video.caption ? T("figcaption", `${B}.video.caption`, p.video.caption) : ""}</figure>` : "";
  let side = "", rest = plain;
  if (vid) { side = vid + (plain.length === 1 ? fig(plain[0], false) : ""); if (plain.length === 1) rest = []; }
  else if (plain.length === 1) { side = fig(plain[0], false); rest = []; }
  const links = [];
  if (p.link && p.link.url) links.push(`<a class="btn" href="${esc(safeUrl(p.link.url))}"${ext(p.link.url)}><span data-path="${B}.link.label">${esc(p.link.label || "View")}</span> <span aria-hidden="true">→</span></a>`);
  for (const r of p.related || []) if (projById(r.project)) links.push(`<a class="textlink" href="#work/${esc(r.project)}">${esc(r.label)}</a>`);
  const order = projectOrder(), at = order.indexOf(p.id);
  const prev = at > 0 ? projById(order[at - 1]) : null, next = at >= 0 && at < order.length - 1 ? projById(order[at + 1]) : null;
  const sec = sectionOf(p.id);
  const st = p.stats && p.stats.items && p.stats.items.length ? `<div class="wrap">${p.stats.title ? T("p", `${B}.stats.title`, p.stats.title, "stats-title") : ""}
    <div class="stats">${p.stats.items.map((x, k) => `<div class="stat"><b data-path="${B}.stats.items.${k}.value">${esc(x.value)}</b><span data-path="${B}.stats.items.${k}.label">${esc(x.label)}</span></div>`).join("")}</div>
    ${p.stats.note ? T("p", `${B}.stats.note`, p.stats.note, "stats-note") : ""}</div>` : "";
  return `
    <div class="proj-bar"><div class="wrap">
      <button class="proj-back" data-close><span aria-hidden="true">←</span><span>${esc(sec ? sec.label : "Back")}</span></button>
      <button class="proj-x" data-close aria-label="Close project">×</button>
    </div></div>
    <article>
      <div class="wrap proj-head">
        <div class="proj-meta">${p.tag || O.edit ? T("span", `${B}.tag`, p.tag, "pill") : ""}${T("span", `${B}.meta`, p.meta)}</div>
        ${T("h1", `${B}.title`, p.title, "display proj-title")}
        ${p.quote || O.edit ? T("p", `${B}.quote`, p.quote ? p.quote : "", "display proj-quote") : ""}
        ${p.quote2 ? T("p", `${B}.quote2`, p.quote2, "display proj-quote") : ""}
      </div>
      <div class="wrap proj-body${side ? "" : " solo"}">
        <div>${P(`${B}.body`, p.body)}${links.length ? `<div class="proj-links">${links.join("")}</div>` : ""}</div>
        ${side ? `<div class="proj-side">${side}</div>` : ""}
      </div>
      ${st}
      ${rest.length || special.length ? `<div class="wrap proj-gal">
        ${rest.length ? `<div class="row">${rest.map(x => fig(x)).join("")}</div>` : ""}
        ${special.map(([im, k]) => `<section>
          <div class="img-head">${T("h3", `${B}.images.${k}.heading`, im.heading || "", "display h3")}
            ${im.link && im.link.url ? `<a class="textlink" href="${esc(safeUrl(im.link.url))}"${ext(im.link.url)}>${esc(im.link.label || "View")} →</a>` : ""}</div>
          ${im.text ? T("p", `${B}.images.${k}.text`, im.text, "img-text") : ""}
          ${IMG(`${B}.images.${k}`, im, "zoom", ' loading="lazy"', true)}</section>`).join("")}
      </div>` : ""}
    </article>
    <nav class="proj-next bg-${sec ? sec.bg === "cream" ? "mint" : "cream" : "mint"}" aria-label="More work"><div class="wrap">
      ${prev ? `<button data-go="${esc(prev.id)}"><small>← Previous</small><strong>${esc(prev.cardTitle || prev.title)}</strong></button>` : ""}
      ${next ? `<button data-go="${esc(next.id)}"><small>Next →</small><strong>${esc(next.cardTitle || next.title)}</strong></button>` : ""}
    </div></nav>`;
}

let openId = null, returnFocus = null, returnScroll = 0;
function openProject(id, fromHash) {
  const p = projById(id); if (!p) return false;
  let el = $("#proj");
  if (!el) { el = document.createElement("div"); el.id = "proj"; el.className = "proj"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
  if (!openId) { returnFocus = document.activeElement; returnScroll = scrollY; }
  const sec = sectionOf(id);
  el.className = "proj bg-" + (sec && sec.bg !== "ink" ? sec.bg : "cream");
  el.setAttribute("aria-label", p.title);
  el.innerHTML = projectHTML(p);
  el.scrollTop = 0;
  openId = id;
  document.body.classList.add("locked");
  requestAnimationFrame(() => el.classList.add("open"));
  if (!O.edit && !fromHash && location.hash !== "#work/" + id) { try { history.pushState(null, "", "#work/" + id); } catch (e) {} }
  el.tabIndex = -1; el.focus({ preventScroll: true });
  if (O.onProject) O.onProject(id);
  return true;
}
function closeProject(fromHash) {
  const el = $("#proj"); if (!el || !openId) return;
  const id = openId; openId = null;
  el.classList.remove("open");
  document.body.classList.remove("locked");
  setTimeout(() => { if (!openId) el.remove(); }, 300);
  if (!O.edit && !fromHash) {
    const sec = sectionOf(id);
    try { history.pushState(null, "", sec ? "#" + sec.anchor : location.pathname); } catch (e) {}
    if (sec && sec.tab != null) showTab(sec.anchor, sec.tab);
  }
  if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  if (O.onProject) O.onProject(null);
}

function safeReplace(a, b, url) { try { history.replaceState(a, b, url); } catch (e) {} }
/* old teletext links (#p201 etc.) still work */
const LEGACY = { 100: "home", 101: "about", 888: "cv", 900: "home", 200: "campaigns", 300: "journeys", 400: "email", 500: "film", 600: "editorial", 700: "voice", 750: "voice" };
function route(fromHash = true) {
  const h = decodeURIComponent(location.hash || "");
  let m = /^#work\/(.+)$/.exec(h);
  if (m) { if (openProject(m[1], fromHash)) return; }
  m = /^#p(\d{3})$/.exec(h);
  if (m) {
    const n = +m[1], p = C.projects.find(x => x.page === n);
    if (p) { safeReplace(null, "", "#work/" + p.id); openProject(p.id, true); return; }
    const id = LEGACY[n], panel = id && document.querySelector(`.tabpanel[data-group="${id}"]`);
    if (panel) { const sec = panel.closest("section"); showTab(sec.id, [...sec.querySelectorAll(".tabpanel")].indexOf(panel)); safeReplace(null, "", "#" + sec.id); sec.scrollIntoView(); return; }
    safeReplace(null, "", id && document.getElementById(id) ? "#" + id : location.pathname);
    if (id && document.getElementById(id)) document.getElementById(id).scrollIntoView();
  }
  if (openId) closeProject(true);
}

/* lightbox, popup, clicks */
function lightbox(img) {
  const d = document.createElement("div");
  d.className = "lb"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Picture");
  d.innerHTML = `<button aria-label="Close">×</button><div><img src="${esc(img.currentSrc || img.src)}" alt="${esc(img.alt)}">${img.alt ? `<p>${esc(img.alt)}</p>` : ""}</div>`;
  const close = () => { d.remove(); document.removeEventListener("keydown", k, true); };
  const k = e => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  d.onclick = close; document.addEventListener("keydown", k, true);
  document.body.appendChild(d); $("button", d).focus();
}
function popup() {
  const p = C.site.popup;
  if (O.edit || !p || !p.enabled) return;
  try { if (sessionStorage.getItem("popupSeen")) return; } catch (e) {}
  setTimeout(() => {
    if (openId) return;
    try { sessionStorage.setItem("popupSeen", "1"); } catch (e) {}
    const d = document.createElement("div");
    d.className = "popup-bg";
    d.innerHTML = `<div class="popup" role="dialog" aria-modal="true" aria-label="${esc(p.title)}"><button class="popup-x" aria-label="Close">×</button>
      <h2 class="display h3">${esc(p.title)}</h2><p class="lede" style="margin:0 auto">${esc(p.text)}</p>
      ${p.buttonLabel ? `<div class="btns" style="justify-content:center"><a class="btn" href="${esc(safeUrl(p.buttonLink))}">${esc(p.buttonLabel)}</a></div>` : ""}</div>`;
    const close = () => d.remove();
    d.addEventListener("click", e => { if (e.target === d || e.target.closest(".popup-x") || e.target.closest(".btn")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); }, { once: true });
    document.body.appendChild(d); $(".popup-x", d).focus();
  }, (Number(p.delaySeconds) || 0) * 1000);
}

document.addEventListener("click", e => {
  if (O.edit) return; // the editor handles clicks itself
  const go = e.target.closest("[data-go]");
  if (go) { e.preventDefault(); openProject(go.dataset.go); return; }
  if (e.target.closest("[data-close]")) { e.preventDefault(); closeProject(); return; }
  const card = e.target.closest("[data-project]");
  if (card && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openProject(card.dataset.project); return; }
  const z = e.target.closest("img.zoom");
  if (z) { lightbox(z); return; }
  const a = e.target.closest('a[href^="#work/"]');
  if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openProject(decodeURIComponent(a.getAttribute("href").slice(6))); return; }
  if (openId) { const hl = e.target.closest('a[href^="#"]'); if (hl) closeProject(true); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && openId && !O.edit && !$(".lb")) closeProject();
  if (e.key === "Escape") document.body.classList.remove("menu-open");
});
addEventListener("popstate", () => C && !O.edit && route(true));
addEventListener("hashchange", () => C && !O.edit && route(true));
let rt = 0;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (C) { refit(); startCurves(); } }, 120); });

/* ---------- public API ---------- */
window.Site = {
  mount(content, opts = {}) {
    C = content; O = opts; resolve = opts.resolve || (s => s);
    render();
    if (!O.edit) { route(true); popup(); }
    requestAnimationFrame(() => document.body.classList.add("loaded"));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { refit(); startCurves(); });
  },
  update(content) {
    C = content; const y = scrollY; render(); scrollTo(0, y);
    if (openId) { const id = openId; if (projById(id)) { const el = $("#proj"), st = el.scrollTop; el.innerHTML = projectHTML(projById(id)); el.scrollTop = st; } else closeProject(true); }
  },
  openProject, closeProject, refit, startCurves, showTab,
  get openId() { return openId; },
  types: Object.keys(S),
};

if (!/[?&]edit=1/.test(location.search)) {
  fetch("content.json", { cache: "no-cache" }).then(r => r.json()).then(c => Site.mount(c))
    .catch(() => { $("#app").innerHTML = '<p style="padding:40px">Sorry, this page didn’t load. Please refresh.</p>'; });
}
})();
