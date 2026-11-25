/* samlewis.fyi editor.
   - The GitHub access token is stored encrypted in admin/auth.json; your password decrypts it in the browser.
   - Edits autosave as a draft in this browser. "Publish" commits content.json and any new images to GitHub,
     and GitHub Pages puts the change live about a minute later. */
(() => {
"use strict";
const DEFAULT_REPO = { owner: "samjoelewis-svg", repo: "samjoelewis", branch: "main" };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const slugify = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
const ICON = {
  up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M17.9 17.9A10 10 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 4.1-5.1M9.9 5.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.2a3 3 0 1 1-4.2-4.2M2 2l20 20"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
};
const BG = { sky: "Sky", mint: "Mint", lilac: "Lilac", cream: "Cream", ink: "Dark" };
const TYPES = {
  hero: { name: "Big headline + image", desc: "Huge headline over a full-width picture" },
  split: { name: "Image + text", desc: "Photo on one side, headline, text and buttons on the other" },
  feature: { name: "Showcase", desc: "One piece of work, uncropped, with its line set big beside it" },
  featured: { name: "Featured work", desc: "Hand-picked project cards with your own descriptions" },
  projects: { name: "Project grid", desc: "A grid of projects that open as their own pages" },
  tabs: { name: "Work with tabs", desc: "Projects sorted into tabs, like Campaigns or Film" },
  ticker: { name: "Moving names", desc: "A scrolling line of clients or skills" },
  text: { name: "Text", desc: "A heading with paragraphs of writing" },
  curved: { name: "Moving curved text", desc: "A line of text drifting along an arc, with social links" },
  gallery: { name: "Image gallery", desc: "A row of pictures with captions" },
  quote: { name: "Big quote", desc: "One standout line, large" },
  cta: { name: "Call to action", desc: "Headline, a line of text and buttons" },
  cv: { name: "CV / experience", desc: "Jobs, dates and bullet points, plus education" },
  contact: { name: "Contact", desc: "Your email, links and a message form" },
  custom: { name: "Free layout", desc: "Start blank and stack headings, text, pictures and buttons" },
};
const BLOCKS = {
  heading: { name: "Heading", make: () => ({ text: "A heading" }) },
  subheading: { name: "Small heading", make: () => ({ text: "A smaller heading" }) },
  text: { name: "Text", make: () => ({ paragraphs: ["Write something here. Press Enter for a new paragraph."] }) },
  image: { name: "Picture", make: () => ({ image: null }) },
  button: { name: "Button", make: () => ({ label: "Get in touch", link: "#contact" }) },
  quote: { name: "Big quote", make: () => ({ text: "A line worth remembering.", by: "" }) },
  spacer: { name: "Space", make: () => ({}) },
};
const CONVERTIBLE = ["hero", "split", "text", "quote", "cta", "feature"];

/* ---------- state ---------- */
let REPO = { ...DEFAULT_REPO }, auth = null, token = null;
let C = null, base = { json: "", contentSha: "" };
const pending = new Map(); // path -> { blob, url }
let hist = [], fut = [], dirty = false;
let selSection = null, selProject = null, tab = "page", previewing = false;
const open = new Set(); // expanded list items in the sidebar
const frame = $("#frame");
const W = () => frame.contentWindow, D = () => frame.contentDocument;

/* ---------- small helpers ---------- */
function toast(msg, ms = 3200) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), ms); }
function getAt(path, obj = C) { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setAt(path, val, obj = C) {
  const ks = path.split("."); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== "object") o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
const resolve = s => (pending.get(s) || {}).url || s;
const thumbSrc = x => { const s = typeof x === "string" ? x : x && x.src; return s ? (/^(https?:|blob:|data:)/.test(resolve(s)) ? resolve(s) : "../" + s) : ""; };
function modal(html, cls = "") {
  const m = $("#modal"); m.innerHTML = `<div class="dialog ${cls}" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ""; document.removeEventListener("keydown", k); };
  const k = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", k);
  m.onclick = e => { if (e.target === m || e.target.closest("[data-x]")) close(); };
  const f = $("input, textarea, button.btn-p", m); f && f.focus();
  return { el: m, close };
}
function ask(title, text, ok = "OK", danger = false) {
  return new Promise(res => {
    const { el, close } = modal(`<div class="dialog-h"><h2>${esc(title)}</h2></div><div class="dialog-b"><p style="margin:0">${text}</p></div>
      <div class="dialog-f"><button class="btn-s" data-no>Cancel</button><button class="${danger ? "btn-d" : "btn-p"}" data-yes>${esc(ok)}</button></div>`, "small");
    $("[data-yes]", el).onclick = () => { close(); res(true); };
    $("[data-no]", el).onclick = () => { close(); res(false); };
    $("[data-yes]", el).focus();
  });
}

/* ---------- crypto: password -> key -> GitHub token ---------- */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function keyFrom(pw, salt, iter) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(secret, pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 600000;
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(pw, salt, iter), new TextEncoder().encode(secret));
  return { v: 1, kdf: "PBKDF2-SHA256", iter, salt: b64(salt), iv: b64(iv), data: b64(data), repo: REPO };
}
async function unseal(a, pw) {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(a.iv) }, await keyFrom(pw, unb64(a.salt), a.iter), unb64(a.data));
  return new TextDecoder().decode(plain);
}

/* ---------- GitHub ---------- */
async function gh(path, { method = "GET", body, tok = token } = {}) {
  const r = await fetch("https://api.github.com" + path, {
    method, cache: "no-store",
    headers: { Authorization: "Bearer " + tok, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) { let m = ""; try { m = (await r.json()).message; } catch (e) {} const err = new Error(m || "GitHub said " + r.status); err.status = r.status; throw err; }
  return r.status === 204 ? null : r.json();
}
const RP = () => `/repos/${REPO.owner}/${REPO.repo}`;
const utf8b64 = s => { const bytes = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const fromb64utf8 = s => new TextDecoder().decode(unb64(s.replace(/\s/g, "")));
const blobB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
async function putFile(path, text, message) {
  let sha; try { sha = (await gh(`${RP()}/contents/${path}?ref=${REPO.branch}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
  return gh(`${RP()}/contents/${path}`, { method: "PUT", body: { message, content: utf8b64(text), branch: REPO.branch, ...(sha ? { sha } : {}) } });
}

/* ---------- draft storage (this browser only) ---------- */
const idb = (() => {
  let p;
  const db = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open("samlewis-editor", 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const run = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction("files", mode); const q = fn(t.objectStore("files")); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  return {
    put: (k, v) => run("readwrite", s => s.put(v, k)).catch(() => {}),
    clear: () => run("readwrite", s => s.clear()).catch(() => {}),
    all: async () => { try { const d = await db(); return await new Promise(res => { const out = []; const c = d.transaction("files").objectStore("files").openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out.push([x.key, x.value]); x.continue(); } else res(out); }; c.onerror = () => res(out); }); } catch (e) { return []; } },
  };
})();
const DRAFT = "samlewis-editor-draft";
let draftT = 0;
function saveDraft() { clearTimeout(draftT); draftT = setTimeout(() => { try { localStorage.setItem(DRAFT, JSON.stringify({ at: Date.now(), base: base.contentSha, content: C })); } catch (e) {} }, 400); }
function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} idb.clear(); }

/* ---------- lock screen + first-time setup ---------- */
async function boot() {
  try { const r = await fetch("auth.json", { cache: "no-store" }); if (r.ok) auth = await r.json(); } catch (e) {}
  if (auth && auth.repo) REPO = { ...REPO, ...auth.repo };
  try { const t = sessionStorage.getItem("samlewis-editor-token"); if (t) { token = t; return start(); } } catch (e) {}
  auth ? showLogin() : showSetup();
}
function showLogin() {
  $("#gate").innerHTML = `<form class="gate-card" id="loginForm">
    <div class="lock">${ICON.lock}</div><h1>Edit your site</h1><p>Enter your password to unlock the editor.</p>
    <div class="pw"><input type="password" id="pw" autocomplete="current-password" aria-label="Password" placeholder="Password" required><button aria-label="Unlock">${ICON.arrow}</button></div>
    <div class="err" id="err" role="alert"></div></form>`;
  $("#pw").focus();
  $("#loginForm").onsubmit = async e => {
    e.preventDefault(); $("#err").textContent = "Unlocking…";
    try { token = await unseal(auth, $("#pw").value); } catch (err) { $("#err").textContent = "That password didn’t work. Try again."; $("#pw").select(); return; }
    try { sessionStorage.setItem("samlewis-editor-token", token); } catch (e2) {}
    start();
  };
}
function showSetup() {
  $("#gate").innerHTML = `<form class="gate-card wide" id="setupForm">
    <div class="lock">${ICON.lock}</div><h1>Set up your editor</h1>
    <p>This happens once. The editor saves your changes to GitHub, so it needs a GitHub key that can only touch this website’s files. Your password locks that key.</p>
    <ol>
      <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub’s new fine-grained token page</a>.</li>
      <li>Name it <code>samlewis.fyi editor</code> and pick an expiry (up to a year).</li>
      <li>Under <b>Repository access</b>, choose <b>Only select repositories</b> and pick <code>${esc(REPO.owner)}/${esc(REPO.repo)}</code>.</li>
      <li>Under <b>Permissions → Repository permissions</b>, set <b>Contents</b> to <b>Read and write</b>.</li>
      <li>Click <b>Generate token</b>, copy it and paste it below.</li>
    </ol>
    <div class="field"><label for="tok">GitHub token</label><input type="password" id="tok" autocomplete="off" required placeholder="github_pat_…"></div>
    <div class="field"><label for="np">Choose an editor password</label><input type="password" id="np" autocomplete="new-password" required minlength="10"><p class="help">At least 10 characters. A short sentence is best, as this key is stored publicly in encrypted form.</p></div>
    <div class="field"><label for="np2">Type it again</label><input type="password" id="np2" autocomplete="new-password" required></div>
    <details><summary class="hint" style="cursor:pointer">Advanced: repository</summary><div class="row2" style="margin-top:10px">
      <div class="field"><label for="rown">Owner</label><input type="text" id="rown" value="${esc(REPO.owner)}"></div>
      <div class="field"><label for="rrep">Repository</label><input type="text" id="rrep" value="${esc(REPO.repo)}"></div></div>
      <div class="field" style="margin-top:10px"><label for="rbr">Branch</label><input type="text" id="rbr" value="${esc(REPO.branch)}"></div></details>
    <div class="btns" style="margin-top:18px"><button class="btn-p">Lock and start editing</button></div>
    <div class="err" id="err" role="alert"></div></form>`;
  $("#setupForm").onsubmit = async e => {
    e.preventDefault();
    const err = $("#err"), tok = $("#tok").value.trim(), pw = $("#np").value;
    if (pw.length < 10) { err.textContent = "Please use at least 10 characters."; return; }
    if (pw !== $("#np2").value) { err.textContent = "Those two passwords don’t match."; return; }
    REPO = { owner: $("#rown").value.trim(), repo: $("#rrep").value.trim(), branch: $("#rbr").value.trim() || "main" };
    err.textContent = "Checking the token with GitHub…";
    try {
      const r = await gh(RP(), { tok });
      if (!r.permissions || !r.permissions.push) { err.textContent = "That token can read the repository but can’t save to it. Set Contents to “Read and write”."; return; }
      token = tok;
      err.textContent = "Locking the token with your password…";
      auth = await seal(tok, pw);
      await putFile("admin/auth.json", JSON.stringify(auth, null, 2) + "\n", "Set up the site editor");
      try { sessionStorage.setItem("samlewis-editor-token", token); } catch (e2) {}
      start();
    } catch (x) { err.textContent = x.status === 401 ? "GitHub didn’t accept that token. Check you copied all of it." : x.status === 404 ? "Couldn’t find that repository with this token. Check step 3." : "Something went wrong: " + x.message; }
  };
}

/* ---------- start ---------- */
async function start() {
  $("#gate").innerHTML = `<div class="gate-card"><div class="lock">${ICON.lock}</div><h1>Opening…</h1><p>Loading your latest content.</p></div>`;
  try {
    const f = await gh(`${RP()}/contents/content.json?ref=${encodeURIComponent(REPO.branch)}`);
    base = { json: fromb64utf8(f.content), contentSha: f.sha };
  } catch (e) {
    if (e.status === 401) { try { sessionStorage.removeItem("samlewis-editor-token"); } catch (x) {} token = null; auth ? showLogin() : showSetup(); toast("GitHub didn’t accept the saved token. It may have expired."); return; }
    $("#gate").innerHTML = `<div class="gate-card"><h1>Couldn’t load</h1><p>${esc(e.message)}</p><button class="btn-p" onclick="location.reload()">Try again</button></div>`; return;
  }
  C = JSON.parse(base.json);
  let draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch (e) {}
  $("#gate").hidden = true; $("#editor").hidden = false;
  if (draft && JSON.stringify(draft.content) !== JSON.stringify(C)) {
    const when = new Date(draft.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    const keep = await ask("Pick up where you left off?", `You have unpublished changes from ${esc(when)} saved in this browser.${draft.base !== base.contentSha ? " The live site has been published since then, so publishing these will replace that version." : ""}`, "Keep my changes");
    if (keep) { C = draft.content; for (const [k, v] of await idb.all()) pending.set(k, { blob: v, url: URL.createObjectURL(v) }); dirty = true; }
    else clearDraft();
  }
  frame.onload = mountFrame;
  frame.src = "../index.html?edit=1";
  wireChrome();
  status();
}
function mountFrame() {
  const d = D();
  const l = d.createElement("link"); l.rel = "stylesheet"; l.href = "admin/edit.css"; l.id = "edcss"; d.head.appendChild(l);
  W().Site.mount(C, { edit: true, resolve, onProject: id => { selProject = id; if (id) selSection = null; renderSide(); decorate(); } });
  bindFrame(d);
  decorate();
  renderSide();
}

/* ---------- history + change tracking ---------- */
function snap() { hist.push(JSON.stringify(C)); if (hist.length > 150) hist.shift(); fut = []; btns(); }
function btns() { $("#undo").disabled = !hist.length; $("#redo").disabled = !fut.length; }
function changed({ render = true, side = false } = {}) {
  dirty = true; saveDraft(); status();
  if (render) paint();
  if (side) renderSide();
}
function undo() { if (!hist.length) return; fut.push(JSON.stringify(C)); C = JSON.parse(hist.pop()); afterJump(); }
function redo() { if (!fut.length) return; hist.push(JSON.stringify(C)); C = JSON.parse(fut.pop()); afterJump(); }
function afterJump() {
  if (selProject && !C.projects.some(p => p.id === selProject)) selProject = null;
  if (selSection != null && !C.sections[selSection]) selSection = null;
  btns(); changed({ side: true });
}
function status(text) {
  const s = $("#status");
  if (text) { s.className = "status"; s.textContent = text; return; }
  s.className = "status " + (dirty ? "dirty" : "okk");
  s.textContent = dirty ? "Unpublished changes" : "Up to date";
}
let paintT = 0;
function paint(later) {
  clearTimeout(paintT);
  const go = () => { if (!W() || !W().Site) return; W().Site.update(C); decorate(); };
  later ? (paintT = setTimeout(go, 250)) : go();
}

/* ---------- the page itself: inline editing ---------- */
const PH = { headline: "Add a headline", caption: "Add a caption", intro: "Add a short intro", kicker: "Small label", tag: "Tag", quote: "Add a big quote line", quote2: "Second quote line", text: "Add some text", by: "Who said it?", meta: "Client · Format · Year", title: "Title", label: "Button text", desc: "Short description", footerNote: "Footer note" };
function decorate() {
  const d = D(); if (!d) return;
  if (previewing) return;
  $$("[data-path]", d).forEach(el => {
    el.contentEditable = "true"; el.spellcheck = true;
    const k = el.dataset.path.split(".").pop(); el.dataset.ph = PH[k] || "Type here";
  });
  $$("[data-paras]", d).forEach(el => { el.contentEditable = "true"; el.spellcheck = true; });
  $$("img[data-img]", d).forEach(el => { if (!el.closest(".card")) el.title = "Click to replace this image"; });
  $$("main > section", d).forEach(sec => {
    if ($(":scope > .ed-bar", sec)) return;
    const i = +sec.dataset.section, s = C.sections[i];
    const wrap = d.createElement("div"); wrap.className = "ed-barwrap"; wrap.contentEditable = "false";
    const bar = d.createElement("div"); bar.className = "ed-bar"; wrap.appendChild(bar);
    bar.innerHTML = `<span class="lbl">${esc((TYPES[s.type] || {}).name || s.type)}</span>
      <button data-act="up" title="Move up" aria-label="Move section up"${i === 0 ? " disabled" : ""}>${ICON.up}</button>
      <button data-act="down" title="Move down" aria-label="Move section down"${i === C.sections.length - 1 ? " disabled" : ""}>${ICON.down}</button>
      <button data-act="bg" title="Change background colour" aria-label="Change background colour"><span class="dot" style="background:${esc((C.site.colors || {})[s.bg] || "#fff")}"></span></button>
      <button data-act="hide" title="${s.hidden ? "Show to visitors" : "Hide from visitors"}" aria-label="${s.hidden ? "Show section" : "Hide section"}">${s.hidden ? ICON.eyeOff : ICON.eye}</button>
      <button data-act="dup" title="Duplicate" aria-label="Duplicate section">${ICON.copy}</button>
      <button data-act="del" title="Delete" aria-label="Delete section">${ICON.trash}</button>
      ${CONVERTIBLE.includes(s.type) ? `<button data-act="free" class="wide" title="Break this section into pieces you can move and add to">Free layout</button>` : ""}
      <button data-act="edit" class="wide" title="Section settings">${ICON.gear}<span>Settings</span></button>`;
    sec.insertBefore(wrap, sec.firstChild);
    const add = d.createElement("button"); add.className = "ed-add"; add.textContent = "+ Add section"; add.contentEditable = "false";
    sec.appendChild(add);
    sec.classList.toggle("ed-sel", i === selSection);
  });
  $$("[data-block]", d).forEach(el => {
    if ($(":scope > .ed-bbar", el)) return;
    const path = el.dataset.block, b = getAt(path), k = +path.split(".").pop(), list = getAt(path.replace(/\.\d+$/, ""));
    const bb = d.createElement("div"); bb.className = "ed-bbar"; bb.contentEditable = "false";
    bb.innerHTML = `<button data-bact="up" title="Move up" aria-label="Move up"${k === 0 ? " disabled" : ""}>${ICON.up}</button>
      <button data-bact="down" title="Move down" aria-label="Move down"${k === list.length - 1 ? " disabled" : ""}>${ICON.down}</button>
      <button data-bact="align" title="Line up left, centre or right">${{ left: "Left", center: "Centre", right: "Right" }[b.align || "left"]}</button>
      <button data-bact="width" title="Narrow, wide or full width">${{ narrow: "Narrow", wide: "Wide", full: "Full width" }[b.width || "wide"]}</button>
      ${b.type === "button" ? `<button data-bact="link" title="Where the button goes">Link…</button>` : ""}
      ${b.type === "image" ? `<button data-bact="img" title="Replace picture">Replace…</button>` : ""}
      <button data-bact="dup" title="Duplicate" aria-label="Duplicate">${ICON.copy}</button>
      <button data-bact="del" title="Delete" aria-label="Delete">${ICON.trash}</button>`;
    el.insertBefore(bb, el.firstChild);
    if (b.type === "image" && !(b.image && b.image.src)) { const ph = d.createElement("button"); ph.className = "ed-addblk"; ph.dataset.bact = "img"; ph.textContent = "Upload a picture"; ph.contentEditable = "false"; el.appendChild(ph); }
  });
  $$(".card[data-project]", d).forEach(card => {
    const media = $(".card-media", card);
    if (!media || $(".ed-open", media)) return;
    const o = d.createElement("button"); o.className = "ed-open"; o.type = "button"; o.contentEditable = "false"; o.textContent = "Open project ↗";
    media.appendChild(o);
  });
  $$("[data-blocks]", d).forEach(el => {
    if ($(":scope > .ed-addblk[data-addblk]", el)) return;
    const a = d.createElement("button"); a.className = "ed-addblk"; a.dataset.addblk = el.dataset.blocks; a.contentEditable = "false";
    a.textContent = "+ Add text, picture or button"; el.appendChild(a);
  });
}
function blockAction(path, act) {
  const listPath = path.replace(/\.\d+$/, ""), list = getAt(listPath), k = +path.split(".").pop(), b = list[k];
  if (act === "img") return pickImage(path + ".image");
  if (act === "link") {
    const { el, close } = modal(`<div class="dialog-h"><h2>Button link</h2><button class="ib" data-x aria-label="Close">${ICON.x}</button></div>
      <form class="dialog-b"><div class="field"><label for="bl">Goes to</label><input id="bl" type="text" value="${esc(b.link)}" placeholder="https://… or #contact"><p class="help">A web address, or # and a section’s link name, like #contact.</p></div><div><button class="btn-p">Save</button></div></form>`, "small");
    $("form", el).onsubmit = e => { e.preventDefault(); snap(); b.link = $("#bl", el).value.trim(); close(); changed({ side: true }); };
    return;
  }
  snap();
  if (act === "up" && k > 0) [list[k - 1], list[k]] = [list[k], list[k - 1]];
  if (act === "down" && k < list.length - 1) [list[k + 1], list[k]] = [list[k], list[k + 1]];
  if (act === "align") b.align = { left: "center", center: "right", right: "left" }[b.align || "left"];
  if (act === "width") b.width = { narrow: "wide", wide: "full", full: "narrow" }[b.width || "wide"];
  if (act === "dup") list.splice(k + 1, 0, clone(b));
  if (act === "del") { list.splice(k, 1); toast("Removed. Press Undo to bring it back."); }
  changed({ side: true });
}
function openAddBlock(listPath) {
  const { el, close } = modal(`<div class="dialog-h"><h2>Add to this section</h2><button class="ib" data-x aria-label="Close">${ICON.x}</button></div>
    <div class="dialog-b"><div class="types">${Object.entries(BLOCKS).map(([k, t]) => `<button class="type" data-blk="${k}"><div class="tx"><b>${esc(t.name)}</b></div></button>`).join("")}</div></div>`, "small");
  $$("[data-blk]", el).forEach(btn => btn.onclick = () => {
    close(); snap();
    const list = getAt(listPath) || []; list.push({ type: btn.dataset.blk, align: "left", width: btn.dataset.blk === "image" ? "full" : "wide", ...BLOCKS[btn.dataset.blk].make() });
    setAt(listPath, list); changed({ side: true });
    if (btn.dataset.blk === "image") pickImage(`${listPath}.${list.length - 1}.image`);
  });
}
function toBlocks(s) {
  const B = (type, o) => ({ type, align: "left", width: "wide", ...o });
  const out = [];
  const btns = l => (l || []).forEach(x => out.push(B("button", { label: x.label, link: x.link })));
  if (s.type === "hero") { out.push(B("heading", { text: s.headline, align: "center", width: "full" })); if (s.image) out.push(B("image", { image: s.image, width: "full" })); if (s.caption) out.push(B("text", { paragraphs: [s.caption] })); }
  if (s.type === "split") { if (s.image) out.push(B("image", { image: s.image, width: "narrow" })); out.push(B("heading", { text: s.headline })); if ((s.columns || []).length) out.push(B("text", { paragraphs: s.columns })); btns(s.buttons); }
  if (s.type === "text") { out.push(B("heading", { text: s.headline })); out.push(B("text", { paragraphs: s.paragraphs || [] })); btns(s.links); }
  if (s.type === "feature") { if (s.image) out.push(B("image", { image: s.image, width: "full" })); if (s.headline) out.push(B("heading", { text: s.headline })); if (s.line) out.push(B("subheading", { text: s.line })); if ((s.paragraphs || []).length) out.push(B("text", { paragraphs: s.paragraphs })); btns(s.buttons); }
  if (s.type === "quote") out.push(B("quote", { text: s.quote, by: s.by, align: "center", width: "full" }));
  if (s.type === "cta") { out.push(B("heading", { text: s.headline, align: "center" })); if (s.text) out.push(B("text", { paragraphs: [s.text], align: "center" })); btns(s.buttons); out.slice(-((s.buttons || []).length)).forEach(b => b.align = "center"); }
  return { id: s.id, type: "custom", navLabel: s.navLabel, bg: s.bg, hidden: s.hidden, blocks: [...out, ...(s.blocks || [])] };
}
function parseParas(el) {
  const blocks = $$(":scope > p, :scope > div, :scope > li", el);
  const parts = blocks.length ? blocks.map(b => b.innerText) : [el.innerText];
  return parts.flatMap(t => t.split(/\n+/)).map(t => t.replace(/\s+/g, " ").trim()).filter(Boolean);
}
function bindFrame(d) {
  if (d.__ed) return; d.__ed = true;
  bindResize(d);
  bindCardDrag(d);
  d.addEventListener("focusin", e => { const el = e.target.closest("[data-path],[data-paras]"); if (el) el.__snap = false; });
  d.addEventListener("input", e => {
    const el = e.target.closest("[data-path],[data-paras]"); if (!el) return;
    if (!el.__snap) { snap(); el.__snap = true; }
    if (el.dataset.path) setAt(el.dataset.path, el.innerText.replace(/\s*\n\s*/g, " "));
    else setAt(el.dataset.paras, parseParas(el));
    if (el.classList.contains("fit")) W().Site.refit();
    dirty = true; saveDraft(); status();
  });
  d.addEventListener("focusout", e => {
    const el = e.target.closest("[data-path],[data-paras]"); if (!el || !el.__snap) return;
    if (el.dataset.path) { const v = el.innerText.replace(/\s+/g, " ").trim(); setAt(el.dataset.path, v); }
    if (!document.activeElement || !$("#side").contains(document.activeElement)) renderSide();
    if (/^site\.|navLabel|\.title$|cardTitle|headline/.test(el.dataset.path || "")) paint(true);
  });
  d.addEventListener("keydown", e => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (el && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); el.blur(); }
    keys(e);
  });
  d.addEventListener("paste", e => {
    const el = e.target.closest && e.target.closest("[data-path],[data-paras]"); if (!el) return;
    e.preventDefault();
    let t = (e.clipboardData || window.clipboardData).getData("text/plain");
    if (el.dataset.path) t = t.replace(/\s*\n\s*/g, " ");
    d.execCommand("insertText", false, t);
  });
  d.addEventListener("mouseover", e => {
    const sec = e.target.closest && e.target.closest("main > section");
    $$("main > section.ed-hover", d).forEach(s => s !== sec && s.classList.remove("ed-hover"));
    if (sec) sec.classList.add("ed-hover");
  });
  d.addEventListener("click", e => {
    const t = e.target;
    if (d.__suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
    const a = t.closest("a"); if (a) e.preventDefault();
    const sec = t.closest("main > section"), i = sec ? +sec.dataset.section : null;
    const act = t.closest(".ed-bar button");
    if (act) { e.stopPropagation(); return sectionAction(i, act.dataset.act); }
    const bact = t.closest("[data-bact]");
    if (bact) { e.stopPropagation(); return blockAction(t.closest("[data-block]").dataset.block, bact.dataset.bact); }
    const addb = t.closest("[data-addblk]");
    if (addb) return openAddBlock(addb.dataset.addblk);
    if (t.closest(".ed-add")) return openAddSection(i + 1);
    if (t.closest("[data-close]")) return W().Site.closeProject(true);
    const go = t.closest("[data-go]"); if (go) return W().Site.openProject(go.dataset.go, true);
    const rel = t.closest('a[href^="#work/"]:not([data-project])'); if (rel) return W().Site.openProject(decodeURIComponent(rel.getAttribute("href").slice(6)), true);
    const opener = t.closest(".ed-open");
    if (opener) { e.stopPropagation(); return W().Site.openProject(opener.closest("[data-project]").dataset.project, true); }
    if (t.closest("[data-path],[data-paras]")) { if (i != null && selSection !== i && !selProject) selectSection(i, false); return; }
    if (t.closest("[data-project]")) { if (i != null && selSection !== i) selectSection(i, false); return; }
    const img = t.closest("img[data-img]");
    if (img && !t.closest(".ed-resize")) return pickImage(img.dataset.img);
    if (t.closest(".ed-resize")) return;
    if (i != null) selectSection(i, false);
  });
}
/* drag the corner of a picture to resize it */
function resizable(img) {
  if (!img || !img.dataset || !img.dataset.img || img.closest(".card, .hero-media, .split-media, .ticker")) return false;
  const v = getAt(img.dataset.img); return v && typeof v === "object";
}
function bindResize(d) {
  const h = d.createElement("div"); h.className = "ed-resize"; h.title = "Drag to resize. Double-click to reset."; h.contentEditable = "false";
  h.innerHTML = '<span class="ed-size"></span>';
  d.body.appendChild(h);
  let target = null, drag = null;
  const place = () => {
    if (!target || !target.isConnected) { h.style.display = "none"; return; }
    const r = target.getBoundingClientRect();
    if (r.width < 40 || r.bottom < 0 || r.top > d.defaultView.innerHeight) { h.style.display = "none"; return; }
    h.style.display = "block"; h.style.left = (r.right - 14) + "px"; h.style.top = (r.bottom - 14) + "px";
  };
  d.addEventListener("mouseover", e => { if (drag) return; const img = e.target.closest && e.target.closest("img[data-img]"); if (img && resizable(img)) { target = img; place(); } else if (!e.target.closest(".ed-resize")) { target = null; place(); } });
  d.addEventListener("scroll", () => { if (!drag) { target = null; place(); } }, true);
  h.addEventListener("pointerdown", e => {
    if (!target) return; e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
    const box = target.parentElement.getBoundingClientRect(), r = target.getBoundingClientRect();
    drag = { x: e.clientX, w: r.width, max: box.width, img: target };
    d.body.classList.add("ed-resizing");
  });
  h.addEventListener("pointermove", e => {
    if (!drag) return;
    const w = Math.max(80, Math.min(drag.max, drag.w + (e.clientX - drag.x)));
    drag.img.style.width = w + "px"; drag.img.style.maxWidth = "none";
    drag.pct = Math.round(w / drag.max * 100);
    h.querySelector(".ed-size").textContent = drag.pct >= 99 ? "Full" : drag.pct + "%";
    place();
  });
  const end = () => {
    if (!drag) return; const { img, pct } = drag; drag = null; d.body.classList.remove("ed-resizing"); h.querySelector(".ed-size").textContent = "";
    if (pct == null) return;
    snap(); const o = getAt(img.dataset.img); if (pct >= 99) delete o.size; else o.size = pct;
    changed();
  };
  h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end);
  h.addEventListener("dblclick", () => { if (!target) return; const o = getAt(target.dataset.img); if (o && o.size) { snap(); delete o.size; changed(); toast("Picture back to its normal size."); } });
}
/* drag project cards to reorder them */
function bindCardDrag(d) {
  let st = null, ghost = null, scrollT = 0;
  const W2 = d.defaultView;
  const clear = () => $$(".ed-drop-l, .ed-drop-r, .ed-replace", d).forEach(x => x.classList.remove("ed-drop-l", "ed-drop-r", "ed-replace"));
  const isFeatured = l => /\.items$/.test(l);
  d.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest("[data-list]")) e.preventDefault(); });
  d.addEventListener("pointerdown", e => {
    const card = e.target.closest && e.target.closest("[data-list][data-idx]");
    if (!card || e.button !== 0 || previewing || e.target.closest("[data-path], [data-paras], .ed-resize, .ed-bar, .ed-bbar, .ed-open")) return;
    st = { card, x: e.clientX, y: e.clientY, list: card.dataset.list, from: +card.dataset.idx, moved: false, to: null, replace: null };
  });
  d.addEventListener("pointermove", e => {
    if (!st) return;
    if (!st.moved) {
      if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8) return;
      st.moved = true; d.body.classList.add("ed-dragging"); st.card.classList.add("ed-dragsrc");
      const r = st.card.getBoundingClientRect();
      ghost = st.card.cloneNode(true); ghost.className = "card ed-ghost"; ghost.style.width = Math.min(r.width, 320) + "px";
      d.body.appendChild(ghost);
    }
    e.preventDefault();
    ghost.style.left = (e.clientX + 14) + "px"; ghost.style.top = (e.clientY + 14) + "px";
    ghost.style.display = "none"; const under = d.elementFromPoint(e.clientX, e.clientY); ghost.style.display = "";
    const tgt = under && under.closest(`[data-list="${st.list}"][data-idx]`);
    clear(); st.to = null; st.replace = null;
    const feat = !isFeatured(st.list) && under && under.closest('[data-list$=".items"][data-idx]');
    if (feat) { feat.classList.add("ed-replace"); st.replace = { list: feat.dataset.list, idx: +feat.dataset.idx }; }
    else if (tgt) {
      const r = tgt.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2;
      tgt.classList.add(after ? "ed-drop-r" : "ed-drop-l"); st.to = +tgt.dataset.idx + (after ? 1 : 0);
    }
    clearInterval(scrollT);
    const edge = 140, h = W2.innerHeight;
    const sp = dist => Math.round(8 + Math.min(1, dist / edge) * 42);
    if (e.clientY < edge) { const v = sp(edge - e.clientY); scrollT = setInterval(() => W2.scrollBy(0, -v), 16); }
    else if (e.clientY > h - edge) { const v = sp(e.clientY - (h - edge)); scrollT = setInterval(() => W2.scrollBy(0, v), 16); }
  });
  const end = () => {
    clearInterval(scrollT);
    if (!st) return; const s2 = st; st = null;
    if (ghost) { ghost.remove(); ghost = null; }
    clear(); d.body.classList.remove("ed-dragging"); s2.card.classList.remove("ed-dragsrc");
    if (!s2.moved) return;
    d.__suppressClick = true; setTimeout(() => { d.__suppressClick = false; }, 60);
    if (s2.replace) {
      const items = getAt(s2.replace.list), id = s2.card.dataset.project, p = C.projects.find(x => x.id === id);
      if (!items || !p) return;
      const at = items.findIndex(x => x.project === id);
      snap();
      if (at === s2.replace.idx) return;
      if (at >= 0) { [items[at], items[s2.replace.idx]] = [items[s2.replace.idx], items[at]]; toast("Already in Selected Work, so I swapped their places."); }
      else { items[s2.replace.idx] = { project: id, tag: p.tag || "", title: p.cardTitle || p.title, desc: p.meta || "", image: null }; toast(`“${p.cardTitle || p.title}” is now in Selected Work. It’s still in All Work too.`); }
      changed({ side: true }); return;
    }
    if (s2.to == null) return;
    let to = s2.to; if (s2.from < to) to--;
    if (to === s2.from) return;
    snap(); const l = getAt(s2.list); const [x] = l.splice(s2.from, 1); l.splice(to, 0, x);
    changed({ side: true });
  };
  d.addEventListener("pointerup", end); d.addEventListener("pointercancel", end);
}
function keys(e) {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "z") {
    const inField = e.target.closest && e.target.closest("#side input, #side textarea, .modal input, .modal textarea");
    if (inField) return;
    e.preventDefault(); e.shiftKey ? redo() : undo();
  } else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  else if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); publish(); }
}

/* ---------- sections ---------- */
function selectSection(i, scroll = true) {
  selProject = null; selSection = i; renderSide();
  const d = D(); $$("main > section", d).forEach(s => s.classList.toggle("ed-sel", +s.dataset.section === i));
  if (scroll && W().Site.openId) W().Site.closeProject(true);
  if (scroll) { const el = $(`main > section[data-section="${i}"]`, d); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); }
}
function uniqueId(base, list, self) { let id = slugify(base), n = 2; while (list.some(x => x !== self && x.id === id)) id = slugify(base) + "-" + n++; return id; }
async function sectionAction(i, act) {
  const S = C.sections, s = S[i];
  if (act === "edit") return selectSection(i, false);
  if (act === "free") {
    if (!(await ask("Switch to free layout?", "This section becomes a stack of separate pieces (heading, text, picture, buttons) that you can move, line up and add to. It looks a little simpler than the designed layout. You can Undo straight after.", "Switch"))) return;
    snap(); S[i] = toBlocks(s); selSection = i; changed({ side: true }); toast("Hover any piece for its toolbar: move it, centre it, resize it or delete it."); return;
  }
  if (act === "up" || act === "down") { const j = act === "up" ? i - 1 : i + 1; if (j < 0 || j >= S.length) return; snap(); [S[i], S[j]] = [S[j], S[i]]; selSection = j; changed({ side: true }); scrollToSection(j); return; }
  if (act === "bg") { const keys = Object.keys(BG); snap(); s.bg = keys[(keys.indexOf(s.bg) + 1) % keys.length]; return changed({ side: true }); }
  if (act === "hide") { snap(); s.hidden = !s.hidden; toast(s.hidden ? "Hidden from visitors. It stays here so you can bring it back." : "Visible to visitors again."); return changed({ side: true }); }
  if (act === "dup") { snap(); const c = clone(s); c.id = uniqueId(s.id, S); c.navLabel = ""; S.splice(i + 1, 0, c); selSection = i + 1; changed({ side: true }); scrollToSection(i + 1); return; }
  if (act === "del") {
    if (!(await ask("Delete this section?", `“${esc(sectionName(s))}” will be removed. You can undo straight after, and nothing changes on the live site until you publish.`, "Delete", true))) return;
    snap(); S.splice(i, 1); selSection = null; changed({ side: true }); toast("Section deleted. Press Undo to bring it back.");
  }
}
function scrollToSection(i) { setTimeout(() => { const el = $(`main > section[data-section="${i}"]`, D()); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }
function sectionName(s) { const hb = (s.blocks || []).find(b => b.type === "heading" || b.type === "subheading"); return s.navLabel || s.headline || (s.type === "custom" && hb && hb.text) || s.text || s.quote || (s.type === "ticker" && (s.items || []).slice(0, 3).map(x => typeof x === "string" ? x : x.name).join(", ")) || (TYPES[s.type] || {}).name || s.type; }
function newSection(type) {
  const first = C.projects.slice(0, 3);
  const T = {
    hero: { headline: "A Big Bold Headline", image: { src: "img/sam.jpg", caption: "" }, caption: "A line or two to sit over the picture." },
    feature: { kicker: "Format · Place", headline: "Project Name", line: "“Your best line goes here.”", paragraphs: ["A few words about the idea and what it did."], image: { src: "img/kings-cross-hero.jpg", caption: "" }, imageSide: "left", buttons: [{ label: "See the campaign", link: "#all-work" }] },
    split: { imageSide: "left", image: { src: "img/sam.jpg", caption: "" }, headline: "A Headline Here", columns: ["Write a few sentences here.", "And a few more here, if you like."], buttons: [{ label: "Get in touch", link: "#contact" }] },
    featured: { headline: "Featured Work", intro: "", items: first.map(p => ({ project: p.id, tag: p.tag, title: p.cardTitle || p.title, desc: p.meta, image: null })) },
    projects: { kicker: "", headline: "New Project Section", intro: "A short line about this group of work.", projects: [] },
    tabs: { kicker: "", headline: "More Work", intro: "", groups: [{ id: "tab-1", name: "First tab", intro: "", projects: first.map(p => p.id) }] },
    ticker: { label: "Work for", items: [{ name: "Client one", logo: null }, { name: "Client two", logo: null }, { name: "Client three", logo: null }], mono: true, duration: 40 },
    text: { headline: "A Heading", paragraphs: ["Write something here. Press Enter to start a new paragraph."], links: [] },
    curved: { text: "Let’s work together", speed: 40, showSocial: true },
    gallery: { kicker: "", headline: "Gallery", intro: "", images: [] },
    quote: { quote: "A line worth remembering.", by: "" },
    cta: { headline: "Let’s Talk", text: "Got a brief or a role in mind? I’d love to hear about it.", buttons: [{ label: "Get in touch", link: "#contact" }] },
    cv: { headline: "Experience", intro: "", jobs: [{ dates: "2020–now", company: "Company", role: "Role", points: ["What you did."] }], educationTitle: "Education", education: [] },
    contact: { headline: "Get in Touch", text: "Say hello.", showForm: true },
    custom: { blocks: [{ type: "heading", align: "left", width: "wide", text: "A heading" }, { type: "text", align: "left", width: "wide", paragraphs: ["Write something here."] }] },
  }[type];
  return { id: uniqueId(type === "projects" ? "work" : type, C.sections), type, navLabel: "", bg: type === "hero" || type === "curved" ? "sky" : "cream", ...clone(T) };
}
function openAddSection(at) {
  const pv = {
    hero: '<div style="width:100%"><i style="height:14px;width:80%;margin:0 auto 8px"></i><i style="height:50px;background:#7d6a5e"></i></div>',
    split: '<div style="display:flex;gap:10px;width:100%;align-items:center"><i style="height:70px;width:45%;background:#7d6a5e"></i><div style="flex:1"><i style="height:12px;margin-bottom:6px"></i><i style="height:4px;margin-bottom:4px;opacity:.5"></i><i style="height:4px;width:70%;opacity:.5"></i></div></div>',
    feature: '<div style="display:flex;gap:10px;width:100%;align-items:center"><i style="height:56px;width:58%;background:#7d6a5e;transform:rotate(-2deg)"></i><div style="flex:1"><i style="height:4px;width:60%;margin-bottom:6px;opacity:.5"></i><i style="height:14px;margin-bottom:6px"></i><i style="height:4px;margin-bottom:4px;opacity:.5"></i><i style="height:10px;width:60%;border-radius:9px"></i></div></div>',
    featured: '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;width:100%"><i style="height:40px;background:#7d6a5e"></i><i style="height:40px;background:#7d6a5e"></i><i style="height:40px;background:#7d6a5e"></i></div>',
    projects: '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;width:100%"><i style="height:28px;background:#7d6a5e"></i><i style="height:28px;background:#7d6a5e"></i><i style="height:28px;background:#7d6a5e"></i><i style="height:28px;background:#7d6a5e"></i><i style="height:28px;background:#7d6a5e"></i></div>',
    tabs: '<div style="width:100%"><div style="display:flex;gap:4px;margin-bottom:8px"><i style="height:10px;width:26px;border-radius:9px"></i><i style="height:10px;width:26px;border-radius:9px;opacity:.4"></i><i style="height:10px;width:26px;border-radius:9px;opacity:.4"></i></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px"><i style="height:30px;background:#7d6a5e"></i><i style="height:30px;background:#7d6a5e"></i><i style="height:30px;background:#7d6a5e"></i></div></div>',
    ticker: '<div style="width:100%;overflow:hidden;white-space:nowrap;font:700 22px Georgia,serif;color:#46282a">Client ✦ <em>Client</em> ✦ Client ✦</div>',
    text: '<div style="display:flex;gap:10px;width:100%"><i style="height:14px;width:35%"></i><div style="flex:1"><i style="height:4px;margin-bottom:4px;opacity:.5"></i><i style="height:4px;margin-bottom:4px;opacity:.5"></i><i style="height:4px;width:60%;opacity:.5"></i></div></div>',
    curved: '<svg viewBox="0 0 120 50" style="width:100%;height:60px"><path d="M0 45 Q60 -10 120 45" stroke="#46282a" stroke-width="7" fill="none" stroke-dasharray="9 4"/></svg>',
    gallery: '<div style="display:flex;gap:6px;width:100%"><i style="height:50px;flex:1.4;background:#7d6a5e"></i><i style="height:50px;flex:1;background:#7d6a5e"></i><i style="height:50px;flex:.8;background:#7d6a5e"></i></div>',
    quote: '<i style="height:16px;width:80%"></i>',
    cta: '<div style="width:100%;text-align:center"><i style="height:12px;width:60%;margin:0 auto 8px"></i><i style="height:14px;width:30%;margin:0 auto;border-radius:9px"></i></div>',
    cv: '<div style="width:100%"><i style="height:3px;margin-bottom:8px"></i><i style="height:3px;margin-bottom:8px"></i><i style="height:3px;margin-bottom:8px"></i><i style="height:3px"></i></div>',
    custom: '<div style="width:100%;display:grid;gap:6px;justify-items:start"><i style="height:12px;width:55%"></i><i style="height:4px;width:80%;opacity:.5"></i><i style="height:4px;width:70%;opacity:.5"></i><i style="height:26px;width:45%;background:#7d6a5e"></i><i style="height:10px;width:22%;border-radius:9px"></i></div>',
    contact: '<div style="display:flex;gap:10px;width:100%"><i style="height:14px;width:40%"></i><div style="flex:1"><i style="height:10px;margin-bottom:5px;background:#fff;border:1px solid #46282a"></i><i style="height:22px;background:#fff;border:1px solid #46282a"></i></div></div>',
  };
  const { el, close } = modal(`<div class="dialog-h"><h2>Add a section</h2><button class="ib" data-x aria-label="Close">${ICON.x}</button></div>
    <div class="dialog-b"><div class="types">${Object.entries(TYPES).map(([k, t]) => `<button class="type" data-type="${k}"><div class="pv">${pv[k]}</div><div class="tx"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></div></button>`).join("")}</div></div>`);
  $$("[data-type]", el).forEach(b => b.onclick = () => {
    close(); snap(); const s = newSection(b.dataset.type);
    const pos = at == null ? C.sections.length : at;
    C.sections.splice(pos, 0, s); selSection = pos; selProject = null; tab = "page";
    changed({ side: true }); scrollToSection(pos);
    toast("Section added. Click its text to edit, or use the settings on the left.");
  });
}

/* ---------- images + video ---------- */
function pickFile(input) { return new Promise(res => { input.value = ""; input.onchange = () => res(input.files[0] || null); input.click(); }); }
/* cut away plain white, grey or black borders (frames, shadows, letterbox bars) */
function trimBorders(cv) {
  const ctx = cv.getContext("2d"), w = cv.width, h = cv.height;
  if (w < 40 || h < 40) return;
  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = (x, y) => { const i = (y * w + x) * 4; return d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; };
  const plain = vals => { let m = 0; for (const v of vals) m += v; m /= vals.length; let sd = 0; for (const v of vals) sd += (v - m) ** 2; sd = Math.sqrt(sd / vals.length); return (sd < 14 && (m > 225 || m < 28)) || (sd < 8 && m > 140); };
  const row = (y, x0, x1) => { const v = []; for (let x = x0; x < x1; x += 2) v.push(lum(x, y)); return v; };
  const col = (x, y0, y1) => { const v = []; for (let y = y0; y < y1; y += 2) v.push(lum(x, y)); return v; };
  let t = 0, b = h, l = 0, r = w;
  while (t < h * .25 && plain(row(t, 0, w))) t++;
  while (h - b < h * .25 && plain(row(b - 1, 0, w))) b--;
  while (l < w * .25 && plain(col(l, t, b))) l++;
  while (w - r < w * .25 && plain(col(r - 1, t, b))) r--;
  if (!t && b === h && !l && r === w) return;
  if (t) t += 2; if (b < h) b -= 2; if (l) l += 2; if (r < w) r -= 2;
  const img = ctx.getImageData(l, t, r - l, b - t);
  cv.width = r - l; cv.height = b - t; ctx.putImageData(img, 0, 0);
}
async function processImage(file) {
  const name = slugify(file.name.replace(/\.[a-z0-9]+$/i, "")).slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
  if (/gif|svg/.test(file.type)) {
    const ext = file.type.includes("svg") ? "svg" : "gif", path = `img/uploads/${name}.${ext}`;
    const url = URL.createObjectURL(file); const dim = await new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([0, 0]); i.src = url; });
    pending.set(path, { blob: file, url }); idb.put(path, file); return { src: path, w: dim[0], h: dim[1] };
  }
  let bmp; try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { bmp = await createImageBitmap(file); }
  const max = 2400, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(bmp, 0, 0, w, h);
  trimBorders(cv);
  let blob = await new Promise(r => cv.toBlob(r, "image/webp", 0.86)), ext = "webp";
  if (!blob || blob.type !== "image/webp") { blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.88)); ext = "jpg"; }
  const path = `img/uploads/${name}.${ext}`;
  pending.set(path, { blob, url: URL.createObjectURL(blob) }); idb.put(path, blob);
  return { src: path, w: cv.width, h: cv.height };
}
async function pickImage(path, { add = false } = {}) {
  const f = await pickFile($("#filePick")); if (!f) return;
  if (!/^image\//.test(f.type)) { toast("That isn’t an image file."); return; }
  status("Preparing image…");
  let im; try { im = await processImage(f); } catch (e) { toast("Couldn’t read that image. Try a JPG or PNG."); status(); return; }
  snap();
  if (add) { const list = getAt(path) || []; list.push({ ...im, caption: "" }); setAt(path, list); }
  else {
    const cur = getAt(path);
    if (typeof cur === "string" || /\.(poster|thumb|shareImage)$/.test(path) || path === "site.shareImage") setAt(path, im.src);
    else setAt(path, { ...(cur || {}), ...im });
  }
  changed({ side: true }); toast("Image added. It goes live when you publish.");
}
async function pickVideo(path) {
  const f = await pickFile($("#videoPick")); if (!f) return;
  if (f.size > 90 * 1024 * 1024) { toast("That video is over 90 MB. Please compress it first."); return; }
  const p = `video/uploads/${slugify(f.name.replace(/\.[a-z0-9]+$/i, "")).slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}.mp4`;
  pending.set(p, { blob: f, url: URL.createObjectURL(f) }); idb.put(p, f);
  snap(); setAt(path, p); changed({ side: true });
  if (f.size > 40 * 1024 * 1024) toast("Big video. Publishing may take a minute.");
}

/* ---------- sidebar ---------- */
function renderSide() {
  const side = $("#side"); if (!C) return;
  const st = side.scrollTop;
  if (selProject && C.projects.some(p => p.id === selProject)) side.innerHTML = projectPane();
  else if (selSection != null && C.sections[selSection]) side.innerHTML = sectionPane(selSection);
  else { selProject = null; selSection = null; side.innerHTML = mainPane(); }
  bindSide(side);
  side.scrollTop = st;
  const d = D(); if (d) $$("main > section", d).forEach(s => s.classList.toggle("ed-sel", +s.dataset.section === selSection));
}
function mainPane() {
  const tabs = `<div class="tabs" role="tablist">${[["page", "Page"], ["projects", "Projects"], ["site", "Site settings"]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>`;
  if (tab === "projects") {
    return tabs + `<div class="pane"><button class="addbtn" data-newproject>${ICON.plus} New project</button>
      <input class="search" type="search" placeholder="Search projects" aria-label="Search projects" data-search>
      <div class="plist">${C.projects.map(p => {
        const where = [...C.sections.filter(s => (s.projects || []).includes(p.id)).map(s => s.headline), ...C.sections.flatMap(s => (s.groups || []).filter(g => (g.projects || []).includes(p.id)).map(g => g.name))].join(", ");
        const t = thumbSrc(p.thumb || (p.images && p.images[0]) || (p.video && p.video.poster));
        return `<button class="pitem" data-openproject="${esc(p.id)}" data-q="${esc((p.title + " " + p.meta + " " + p.cardTitle).toLowerCase())}">${t ? `<img src="${esc(t)}" alt="">` : `<span class="noimg"></span>`}<span><b>${esc(p.cardTitle || p.title)}</b><small>${esc(where || "Not shown in any section")}</small></span></button>`;
      }).join("")}</div></div>`;
  }
  if (tab === "site") return tabs + `<div class="pane">${form(C.site, "site", SITE_FIELDS)}</div>`;
  return tabs + `<div class="pane">
    <p class="hint">Click any words on the page to change them. Click a picture to replace it. Drag sections here to reorder them.</p>
    <div class="slist" data-slist>${C.sections.map((s, i) => `<div class="sitem${i === selSection ? " sel" : ""}${s.hidden ? " hid" : ""}" draggable="true" data-sidx="${i}">
      <span class="grip" title="Drag to reorder" aria-hidden="true">${ICON.grip}</span>
      <span class="swatch" style="background:${esc((C.site.colors || {})[s.bg] || "#fff")}"></span>
      <span class="s-name"><b>${esc(sectionName(s))}</b><small>${esc((TYPES[s.type] || {}).name || s.type)}${s.navLabel ? " · in menu" : ""}</small></span>
      <span class="s-act"><button data-sact="up" title="Move up" aria-label="Move section up"${i === 0 ? " disabled" : ""}>${ICON.up}</button><button data-sact="down" title="Move down" aria-label="Move section down"${i === C.sections.length - 1 ? " disabled" : ""}>${ICON.down}</button><button data-sact="hide" title="${s.hidden ? "Show" : "Hide"}" aria-label="${s.hidden ? "Show section" : "Hide section"}">${s.hidden ? ICON.eyeOff : ICON.eye}</button><button data-sact="del" title="Delete" aria-label="Delete section">${ICON.trash}</button></span>
    </div>`).join("")}</div>
    <button class="addbtn" data-addsection>${ICON.plus} Add section</button></div>`;
}
function sectionPane(i) {
  const s = C.sections[i];
  return `<div class="pane-h"><button class="back" data-back>${ICON.back} Sections</button><h2>${esc((TYPES[s.type] || {}).name || s.type)}</h2></div>
    <div class="pane">${form(s, "sections." + i, [...(SECTION_FIELDS[s.type] || []), ...COMMON_FIELDS])}
    <div class="danger-zone"><button class="btn-s" data-sact2="dup">Duplicate section</button><button class="btn-d" data-sact2="del">Delete section</button></div></div>`;
}
function projectPane() {
  const n = C.projects.findIndex(p => p.id === selProject), p = C.projects[n];
  const homes = [];
  C.sections.forEach((s, i) => {
    if (s.type === "projects") homes.push([`sections.${i}.projects`, s.headline]);
    if (s.type === "tabs") (s.groups || []).forEach((g, k) => homes.push([`sections.${i}.groups.${k}.projects`, `${s.headline} → ${g.name}`]));
  });
  return `<div class="pane-h"><button class="back" data-back>${ICON.back} Back</button><h2>${esc(p.cardTitle || p.title)}</h2></div>
    <div class="pane"><p class="hint">This project is open on the right. Click its words or pictures there to edit them, or use these settings.</p>
    ${form(p, "projects." + n, PROJECT_FIELDS)}
    <div class="group"><h3>Show this project in</h3>${homes.map(([path, name]) => `<label class="check"><input type="checkbox" data-member="${path}"${(getAt(path) || []).includes(p.id) ? " checked" : ""}> ${esc(name)}</label>`).join("") || '<p class="hint">Add a “Work with tabs” or “Project grid” section first.</p>'}</div>
    <div class="danger-zone"><button class="btn-s" data-pact="dup">Duplicate project</button><button class="btn-d" data-pact="del">Delete project</button></div></div>`;
}

/* field definitions */
const BLOCK_FIELDS = [
  { k: "type", t: "select", label: "Kind", opts: Object.entries(BLOCKS).map(([k, b]) => [k, b.name]) },
  { k: "text", t: "textarea", label: "Words", when: b => ["heading", "subheading", "quote"].includes(b.type) },
  { k: "by", t: "text", label: "Who said it", when: b => b.type === "quote" },
  { k: "paragraphs", t: "paras", label: "Text", help: "Leave a blank line between paragraphs.", when: b => b.type === "text" },
  { k: "label", t: "text", label: "Button text", when: b => b.type === "button" },
  { k: "link", t: "link", label: "Goes to", when: b => b.type === "button" },
  { k: "image", t: "image", label: "Picture", when: b => b.type === "image" },
  { k: "image.caption", t: "text", label: "Caption", when: b => b.type === "image" },
  { k: "align", t: "select", label: "Line up", opts: [["left", "Left"], ["center", "Centre"], ["right", "Right"]] },
  { k: "width", t: "select", label: "Width", opts: [["narrow", "Narrow"], ["wide", "Wide"], ["full", "Full width"]] },
];
const COMMON_FIELDS = [
  { k: "blocks", t: "list", label: "Extra pieces in this section", item: "Piece", help: "Text, pictures and buttons added under the section’s main content. Drag to reorder.", addBlocks: true,
    title: b => (BLOCKS[b.type] || {}).name + (b.text || b.label ? ": " + (b.text || b.label) : b.paragraphs ? ": " + (b.paragraphs[0] || "") : "") },
  { g: "Section" },
  { k: "navLabel", t: "text", label: "Show in the menu as", help: "Leave empty to keep this section out of the top menu." },
  { k: "bg", t: "bg", label: "Background colour" },
  { k: "id", t: "sectionid", label: "Link name", help: "Used for jump links, e.g. samlewis.fyi/#about" },
  { k: "hidden", t: "check", label: "Hide this section from visitors" },
];
const BUTTONS = { k: "buttons", t: "list", label: "Buttons", item: "Button", title: b => b.label, fields: [{ k: "label", t: "text", label: "Button text" }, { k: "link", t: "link", label: "Goes to" }], make: () => ({ label: "New button", link: "#contact" }) };
const IMGITEM = [{ k: null, t: "image", label: "Picture" }, { k: "caption", t: "text", label: "Caption", help: "Also read out to people using screen readers." }];
const SECTION_FIELDS = {
  hero: [{ k: "headline", t: "text", label: "Headline", help: "It automatically grows to fill the width. Leave empty for just the picture." }, { k: "caption", t: "textarea", label: "Text over the picture" }, { k: "image", t: "image", label: "Picture" }],
  split: [{ k: "headline", t: "text", label: "Headline" }, { k: "subheadline", t: "text", label: "Line under the headline (optional)" }, { k: "columns", t: "strings", label: "Text columns", item: "Column" }, { k: "image", t: "image", label: "Picture" },
    { k: "imageSide", t: "select", label: "Picture side", opts: [["left", "Left"], ["right", "Right"]] }, BUTTONS],
  featured: [{ k: "headline", t: "text", label: "Headline" }, { k: "intro", t: "textarea", label: "Intro" },
    { k: "items", t: "list", label: "Cards", item: "Card", title: x => x.title, fields: [{ k: "project", t: "project", label: "Opens project" }, { k: "tag", t: "text", label: "Tag" }, { k: "title", t: "text", label: "Title" }, { k: "desc", t: "text", label: "Description" }, { k: "image", t: "image", label: "Picture", help: "Leave empty to use the project’s first picture." }],
      make: () => ({ project: C.projects[0].id, tag: "", title: C.projects[0].cardTitle || C.projects[0].title, desc: "", image: null }) }],
  projects: [{ k: "kicker", t: "text", label: "Small label above the headline" }, { k: "headline", t: "text", label: "Headline" }, { k: "intro", t: "textarea", label: "Intro" }, { k: "projects", t: "refs", label: "Projects in this section", help: "Drag to change the order." }],
  text: [{ k: "headline", t: "text", label: "Headline" }, { k: "paragraphs", t: "paras", label: "Text", help: "Leave a blank line between paragraphs." },
    { k: "links", t: "list", label: "Links", item: "Link", title: x => x.label, fields: [{ k: "label", t: "text", label: "Text" }, { k: "link", t: "link", label: "Goes to" }], make: () => ({ label: "New link", link: "https://" }) }],
  curved: [{ k: "text", t: "text", label: "Moving text" }, { k: "speed", t: "range", label: "Speed", min: 0, max: 140 }, { k: "showSocial", t: "check", label: "Show LinkedIn and email buttons underneath" }],
  gallery: [{ k: "kicker", t: "text", label: "Small label" }, { k: "headline", t: "text", label: "Headline" }, { k: "intro", t: "textarea", label: "Intro" },
    { k: "images", t: "list", label: "Pictures", item: "Picture", title: x => x.caption || (x.src || "").split("/").pop(), fields: IMGITEM, addImage: true }],
  quote: [{ k: "quote", t: "textarea", label: "Quote" }, { k: "by", t: "text", label: "Who said it" }],
  feature: [{ k: "kicker", t: "text", label: "Small label", help: "Like the format and place: “Out of home · King’s Cross”." }, { k: "headline", t: "text", label: "Headline", help: "The project, like “HBO Max UK Launch”." }, { k: "line", t: "textarea", label: "The line", help: "Your tagline, shown under the headline in italics." },
    { k: "paragraphs", t: "paras", label: "Text", help: "Leave a blank line between paragraphs." }, { k: "image", t: "image", label: "Picture", help: "Shown whole, never cropped." },
    { k: "imageSide", t: "select", label: "Picture side", opts: [["left", "Left"], ["right", "Right"]] }, BUTTONS],
  tabs: [{ k: "kicker", t: "text", label: "Small label above the headline" }, { k: "headline", t: "text", label: "Headline" }, { k: "intro", t: "textarea", label: "Intro" },
    { k: "groups", t: "list", label: "Tabs", item: "Tab", help: "Drag tabs to reorder them. Open a tab to choose its projects.", title: g => `${g.name} (${(g.projects || []).length})`,
      fields: [{ k: "name", t: "text", label: "Tab name" }, { k: "intro", t: "textarea", label: "Line above the projects" }, { k: "projects", t: "refs", label: "Projects in this tab", help: "Drag to change the order." }, { k: "id", t: "text", label: "Short name for links" }],
      make: () => ({ id: "tab-" + Math.random().toString(36).slice(2, 6), name: "New tab", intro: "", projects: [] }) }],
  ticker: [{ k: "label", t: "text", label: "Small label above" },
    { k: "items", t: "list", label: "Names and logos", item: "Name", help: "Upload a logo to show it instead of the name. PNG with a transparent background or SVG works best.", title: x => (typeof x === "string" ? x : x.name) + (x && x.logo ? " ✓ logo" : ""),
      fields: [{ k: "name", t: "text", label: "Name", help: "Read out to screen readers, and shown when there’s no logo." }, { k: "logo", t: "image", label: "Logo" }], make: () => ({ name: "New name", logo: null }) },
    { k: "mono", t: "check", label: "Show all logos in one dark colour", help: "Makes mixed logos look like a set." },
    { k: "duration", t: "number", label: "Seconds for one loop", help: "Bigger is slower." }],
  cta: [{ k: "headline", t: "text", label: "Headline" }, { k: "text", t: "textarea", label: "Text" }, BUTTONS],
  cv: [{ k: "headline", t: "text", label: "Headline" }, { k: "intro", t: "textarea", label: "Intro" },
    { k: "jobs", t: "list", label: "Jobs", item: "Job", title: j => `${j.company} · ${j.dates}`, fields: [{ k: "dates", t: "text", label: "Dates" }, { k: "company", t: "text", label: "Company" }, { k: "role", t: "text", label: "Role" }, { k: "points", t: "paras", label: "Bullet points", help: "One per line." , lines: true }],
      make: () => ({ dates: "Year–Year", company: "Company", role: "Role", points: ["What you did."] }) },
    { k: "educationTitle", t: "text", label: "Education heading" },
    { k: "education", t: "list", label: "Education & tools", item: "Row", title: e => `${e.label} · ${e.place}`, fields: [{ k: "label", t: "text", label: "Label" }, { k: "place", t: "text", label: "Where / what" }, { k: "detail", t: "text", label: "Detail" }], make: () => ({ label: "", place: "", detail: "" }) }],
  contact: [{ k: "headline", t: "text", label: "Headline" }, { k: "text", t: "textarea", label: "Text" }, { k: "showForm", t: "check", label: "Show a message form", help: "The form opens the visitor’s email app with their message ready to send to you. Your email address is set in Site settings." }],
};
SECTION_FIELDS.custom = [];
const PROJECT_FIELDS = [
  { k: "title", t: "text", label: "Title" },
  { k: "cardTitle", t: "text", label: "Short title for cards" },
  { k: "tag", t: "text", label: "Tag", help: "Like Campaign, Trailer or Email." },
  { k: "meta", t: "text", label: "Details line", help: "Client · Format · Year" },
  { k: "quote", t: "textarea", label: "Big line", help: "A tagline or headline you wrote. Shown large." },
  { k: "quote2", t: "textarea", label: "Second big line" },
  { k: "body", t: "paras", label: "Write-up", help: "Leave a blank line between paragraphs." },
  { g: "Pictures" },
  { k: "images", t: "list", label: "Pictures", item: "Picture", title: x => x.heading || x.caption || (x.src || "").split("/").pop(), addImage: true,
    fields: [...IMGITEM, { k: "heading", t: "text", label: "Heading above it (optional)" }, { k: "text", t: "textarea", label: "Text above it (optional)" }, { k: "link.url", t: "link", label: "Link (optional)" }, { k: "link.label", t: "text", label: "Link text" }] },
  { k: "thumb", t: "image", label: "Card picture (optional)", help: "Leave empty to use the first picture." },
  { g: "Video" },
  { k: "video.src", t: "video", label: "Video file (MP4)" },
  { k: "video.poster", t: "image", label: "Still shown before it plays" },
  { k: "video.caption", t: "text", label: "Video caption" },
  { g: "Links" },
  { k: "link.url", t: "link", label: "Button link", help: "E.g. a YouTube trailer." },
  { k: "link.label", t: "text", label: "Button text" },
  { k: "related", t: "list", label: "Links to other projects", item: "Link", title: r => r.label, fields: [{ k: "project", t: "project", label: "Project" }, { k: "label", t: "text", label: "Link text" }], make: () => ({ project: C.projects[0].id, label: "See also" }) },
  { g: "Results" },
  { k: "stats.title", t: "text", label: "Results heading" },
  { k: "stats.items", t: "list", label: "Big numbers", item: "Number", title: x => `${x.value} · ${x.label}`, fields: [{ k: "value", t: "text", label: "Number" }, { k: "label", t: "text", label: "What it means" }], make: () => ({ value: "+10%", label: "What it measures" }) },
  { k: "stats.note", t: "textarea", label: "Small print" },
  { g: "Address" },
  { k: "id", t: "projectid", label: "Web address", help: "samlewis.fyi/#work/… Changing this breaks old links to the project." },
];
const SITE_FIELDS = [
  { g: "Basics" },
  { k: "logoText", t: "text", label: "Name in the top corner" },
  { k: "email", t: "text", label: "Email address" },
  { k: "linkedin", t: "link", label: "LinkedIn link" },
  { k: "footerTitle", t: "text", label: "Footer name" },
  { k: "footerNote", t: "text", label: "Footer line" },
  { g: "Colours" },
  { k: "colors.sky", t: "color", label: "Sky" }, { k: "colors.mint", t: "color", label: "Mint" }, { k: "colors.lilac", t: "color", label: "Lilac" },
  { k: "colors.cream", t: "color", label: "Cream" }, { k: "colors.ink", t: "color", label: "Text and dark" }, { k: "colors.accent", t: "color", label: "Buttons" },
  { g: "Announcement bar" },
  { k: "announcement.enabled", t: "check", label: "Show a bar across the top of the site" },
  { k: "announcement.text", t: "text", label: "Message" },
  { k: "announcement.link", t: "link", label: "Link (optional)" },
  { g: "Pop-up" },
  { k: "popup.enabled", t: "check", label: "Show a pop-up to new visitors", help: "Shown once per visit." },
  { k: "popup.title", t: "text", label: "Headline" },
  { k: "popup.text", t: "textarea", label: "Text" },
  { k: "popup.buttonLabel", t: "text", label: "Button text" },
  { k: "popup.buttonLink", t: "link", label: "Button link" },
  { k: "popup.delaySeconds", t: "number", label: "Seconds before it appears" },
  { g: "Search engines and sharing" },
  { k: "title", t: "text", label: "Browser tab title" },
  { k: "description", t: "textarea", label: "Description", help: "Shown by Google under your name." },
  { k: "shareImage", t: "image", label: "Picture when shared", help: "Shown when someone shares your link." },
];

/* ---------- form builder ---------- */
let fid = 0;
function form(obj, basePath, fields) {
  let out = "", inGroup = false;
  for (const f of fields) {
    if (f.g) { if (inGroup) out += "</div>"; out += `<div class="group"><h3>${esc(f.g)}</h3>`; inGroup = true; continue; }
    out += field(obj, basePath, f);
  }
  if (inGroup) out += "</div>";
  return out;
}
function field(obj, basePath, f) {
  if (f.when && !f.when(obj || {})) return "";
  const path = f.k == null ? basePath : basePath + "." + f.k;
  const v = f.k == null ? obj : getAt(f.k, obj);
  const id = "f" + ++fid;
  const help = f.help ? `<p class="help">${esc(f.help)}</p>` : "";
  const lab = `<label for="${id}">${esc(f.label)}</label>`;
  switch (f.t) {
    case "text": case "link": case "sectionid": case "projectid":
      return `<div class="field">${lab}<input id="${id}" type="text" data-f="${path}" data-t="${f.t}" value="${esc(v)}"${f.t === "link" ? ' placeholder="https://… or #section-name"' : ""}>${help}</div>`;
    case "number": return `<div class="field">${lab}<input id="${id}" type="number" min="0" data-f="${path}" data-t="number" value="${esc(v ?? 0)}">${help}</div>`;
    case "range": return `<div class="field">${lab}<input id="${id}" type="range" min="${f.min}" max="${f.max}" data-f="${path}" data-t="number" value="${esc(v ?? 40)}">${help}</div>`;
    case "textarea": return `<div class="field">${lab}<textarea id="${id}" data-f="${path}" data-t="text">${esc(v)}</textarea>${help}</div>`;
    case "paras": return `<div class="field">${lab}<textarea id="${id}" class="tall" data-f="${path}" data-t="${f.lines ? "lines" : "paras"}">${esc((v || []).join(f.lines ? "\n" : "\n\n"))}</textarea>${help}</div>`;
    case "check": return `<div class="field"><label class="check"><input type="checkbox" data-f="${path}" data-t="check"${v ? " checked" : ""}> ${esc(f.label)}</label>${help}</div>`;
    case "select": return `<div class="field">${lab}<select id="${id}" data-f="${path}" data-t="text">${f.opts.map(([a, b]) => `<option value="${esc(a)}"${a === v ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>${help}</div>`;
    case "bg": return `<div class="field"><span class="lab">${esc(f.label)}</span><div class="bgs" role="group" aria-label="${esc(f.label)}">${Object.entries(BG).map(([k, n]) => `<button type="button" title="${n}" aria-label="${n}" aria-pressed="${v === k}" class="${v === k ? "on" : ""}" data-bg="${path}" data-val="${k}" style="background:${esc(C.site.colors[k])}"></button>`).join("")}</div>${help}</div>`;
    case "color": return `<div class="field">${lab}<div class="colorrow"><input type="color" aria-label="${esc(f.label)}" data-f="${path}" data-t="color" value="${esc(v || "#000000")}"><input id="${id}" type="text" data-f="${path}" data-t="text" value="${esc(v)}"></div></div>`;
    case "image": {
      const t = thumbSrc(v);
      return `<div class="field"><span class="lab">${esc(f.label)}</span><div class="imgf">${t ? `<img class="th" src="${esc(t)}" alt="">` : `<span class="th"></span>`}
        <div class="btns"><button type="button" class="mini" data-img="${path}">${t ? "Replace" : "Upload"}</button>${t && f.k != null ? `<button type="button" class="mini danger" data-imgclear="${path}">Remove</button>` : ""}</div></div>${help}</div>`;
    }
    case "video": return `<div class="field"><span class="lab">${esc(f.label)}</span><div class="imgf"><span class="hint" style="flex:1;word-break:break-all">${esc(v ? String(v).split("/").pop() : "No video")}</span>
      <div class="btns"><button type="button" class="mini" data-vid="${path}">${v ? "Replace" : "Upload"}</button>${v ? `<button type="button" class="mini danger" data-imgclear="${path}">Remove</button>` : ""}</div></div>${help}</div>`;
    case "project": return `<div class="field">${lab}<select id="${id}" data-f="${path}" data-t="text">${C.projects.map(p => `<option value="${esc(p.id)}"${p.id === v ? " selected" : ""}>${esc(p.cardTitle || p.title)}</option>`).join("")}</select>${help}</div>`;
    case "strings": {
      const list = v || [];
      return `<div class="field"><span class="lab">${esc(f.label)}</span><div class="list">${list.map((x, k) => `<div class="li" data-li="${path}" data-k="${k}" draggable="true"><div class="li-h"><span class="grip" aria-hidden="true">${ICON.grip}</span><span class="t">${esc(f.item)} ${k + 1}</span><button type="button" data-lidel="${path}" data-k="${k}" aria-label="Remove">${ICON.trash}</button></div>
        <div class="li-b"><textarea aria-label="${esc(f.item)} ${k + 1}" data-f="${path}.${k}" data-t="text">${esc(x)}</textarea></div></div>`).join("")}</div>
        <button type="button" class="mini" data-stradd="${path}">+ Add ${esc(f.item.toLowerCase())}</button></div>`;
    }
    case "refs": {
      const list = v || [];
      const rest = C.projects.filter(p => !list.includes(p.id));
      return `<div class="field"><span class="lab">${esc(f.label)}</span>${help}<div class="refs">${list.map((pid, k) => { const p = C.projects.find(x => x.id === pid); return p ? `<div class="ref" draggable="true" data-ref="${path}" data-k="${k}"><span class="grip" aria-hidden="true">${ICON.grip}</span><span class="t">${esc(p.cardTitle || p.title)}</span><button type="button" data-refopen="${esc(pid)}" aria-label="Edit project" title="Edit project">${ICON.chev}</button><button type="button" data-refdel="${path}" data-k="${k}" aria-label="Remove from section" title="Remove from this section">${ICON.x}</button></div>` : ""; }).join("")}</div>
        <select aria-label="Add a project" data-refadd="${path}"><option value="">+ Add a project…</option><option value="__new">New project</option>${rest.map(p => `<option value="${esc(p.id)}">${esc(p.cardTitle || p.title)}</option>`).join("")}</select></div>`;
    }
    case "list": {
      const list = v || [];
      return `<div class="field"><span class="lab">${esc(f.label)}</span>${help}<div class="list">${list.map((x, k) => {
        const ip = `${path}.${k}`, isOpen = open.has(ip);
        return `<div class="li" data-li="${path}" data-k="${k}" draggable="true"><div class="li-h" data-toggle="${ip}"><span class="grip" aria-hidden="true">${ICON.grip}</span><span class="t">${esc((f.title && f.title(x)) || f.item + " " + (k + 1))}</span>
          <button type="button" data-lidup="${path}" data-k="${k}" aria-label="Duplicate" title="Duplicate">${ICON.copy}</button><button type="button" data-lidel="${path}" data-k="${k}" aria-label="Remove" title="Remove">${ICON.trash}</button></div>
          ${isOpen ? `<div class="li-b">${(f.fields || BLOCK_FIELDS).map(sf => field(x, ip, sf)).join("")}</div>` : ""}</div>`;
      }).join("")}</div>
      ${f.addBlocks ? `<button type="button" class="mini" data-addblkside="${path}">+ Add a piece</button>` : f.addImage ? `<button type="button" class="mini" data-imgadd="${path}">+ Upload a picture</button>` : `<button type="button" class="mini" data-liadd="${path}">+ Add ${esc(f.item.toLowerCase())}</button>`}</div>`;
    }
  }
  return "";
}
const MAKERS = () => {
  const m = {};
  const scan = (fields, p) => fields.forEach(f => { if (f.t === "list" && f.make) m[f.k] = f.make; });
  Object.values(SECTION_FIELDS).forEach(scan); scan(PROJECT_FIELDS); return m;
};

function bindSide(side) {
  // tabs + navigation
  $$("[data-tab]", side).forEach(b => b.onclick = () => { tab = b.dataset.tab; renderSide(); });
  const bk = $("[data-back]", side); if (bk) bk.onclick = () => { if (selProject) W().Site.closeProject(true); selProject = null; selSection = null; renderSide(); };
  const as = $("[data-addsection]", side); if (as) as.onclick = () => openAddSection(null);
  const np = $("[data-newproject]", side); if (np) np.onclick = () => newProject(null);
  const sr = $("[data-search]", side); if (sr) sr.oninput = () => { const q = sr.value.toLowerCase(); $$("[data-q]", side).forEach(x => x.hidden = !x.dataset.q.includes(q)); };
  $$("[data-openproject]", side).forEach(b => b.onclick = () => { W().Site.openProject(b.dataset.openproject, true); });
  $$("[data-refopen]", side).forEach(b => b.onclick = () => W().Site.openProject(b.dataset.refopen, true));
  // section list
  $$(".sitem", side).forEach(it => {
    const i = +it.dataset.sidx;
    it.onclick = e => { const a = e.target.closest("[data-sact]"); if (a) { e.stopPropagation(); return sectionAction(i, a.dataset.sact); } selectSection(i); };
  });
  $$("[data-sact2]", side).forEach(b => b.onclick = () => sectionAction(selSection, b.dataset.sact2));
  dnd(side, ".sitem", "data-sidx", (from, to) => { snap(); const [s] = C.sections.splice(from, 1); C.sections.splice(to, 0, s); if (selSection === from) selSection = to; changed({ side: true }); });
  // project actions
  $$("[data-pact]", side).forEach(b => b.onclick = () => projectAction(b.dataset.pact));
  $$("[data-member]", side).forEach(cb => cb.onchange = () => {
    snap(); const path = cb.dataset.member; let l = getAt(path) || [];
    if (cb.checked) { if (!l.includes(selProject)) l.push(selProject); } else l = l.filter(x => x !== selProject);
    setAt(path, l); changed();
  });
  // plain fields
  $$("[data-f]", side).forEach(inp => {
    inp.addEventListener("focus", () => inp.__snap = false);
    const ev = inp.type === "checkbox" || inp.tagName === "SELECT" || inp.type === "color" ? "change" : "input";
    inp.addEventListener(ev, () => onField(inp, ev === "change"));
    if (ev === "input") inp.addEventListener("change", () => onField(inp, true, true));
  });
  $$("[data-bg]", side).forEach(b => b.onclick = () => { snap(); setAt(b.dataset.bg, b.dataset.val); changed({ side: true }); });
  $$("[data-img]", side).forEach(b => b.onclick = () => pickImage(b.dataset.img));
  $$("[data-vid]", side).forEach(b => b.onclick = () => pickVideo(b.dataset.vid));
  $$("[data-imgclear]", side).forEach(b => b.onclick = () => { snap(); const p = b.dataset.imgclear, cur = getAt(p); setAt(p, typeof cur === "string" ? "" : null); changed({ side: true }); });
  $$("[data-imgadd]", side).forEach(b => b.onclick = () => pickImage(b.dataset.imgadd, { add: true }));
  $$("[data-addblkside]", side).forEach(b => b.onclick = () => openAddBlock(b.dataset.addblkside));
  // lists
  $$("[data-toggle]", side).forEach(h => h.onclick = e => { if (e.target.closest("button")) return; const p = h.dataset.toggle; open.has(p) ? open.delete(p) : open.add(p); renderSide(); });
  $$("[data-lidel]", side).forEach(b => b.onclick = () => { snap(); getAt(b.dataset.lidel).splice(+b.dataset.k, 1); changed({ side: true }); });
  $$("[data-lidup]", side).forEach(b => b.onclick = () => { snap(); const l = getAt(b.dataset.lidup); l.splice(+b.dataset.k + 1, 0, clone(l[+b.dataset.k])); changed({ side: true }); });
  $$("[data-liadd]", side).forEach(b => b.onclick = () => {
    const p = b.dataset.liadd, key = p.split(".").filter(x => !/^\d+$/.test(x)).slice(-1)[0], mk = MAKERS()[p.split(".").slice(-2).join(".")] || MAKERS()[key];
    snap(); const l = getAt(p) || []; l.push(mk ? mk() : {}); setAt(p, l); open.add(`${p}.${l.length - 1}`); changed({ side: true });
  });
  $$("[data-stradd]", side).forEach(b => b.onclick = () => { snap(); const l = getAt(b.dataset.stradd) || []; l.push("New text."); setAt(b.dataset.stradd, l); changed({ side: true }); });
  dndLists(side, ".li", "data-li");
  // refs
  $$("[data-refdel]", side).forEach(b => b.onclick = () => { snap(); getAt(b.dataset.refdel).splice(+b.dataset.k, 1); changed({ side: true }); });
  $$("[data-refadd]", side).forEach(s => s.onchange = () => {
    if (!s.value) return;
    if (s.value === "__new") return newProject(s.dataset.refadd);
    snap(); const l = getAt(s.dataset.refadd) || []; l.push(s.value); setAt(s.dataset.refadd, l); changed({ side: true });
  });
  dndLists(side, ".ref", "data-ref");
}
function onField(inp, final, commitOnly) {
  const path = inp.dataset.f, t = inp.dataset.t;
  let v = t === "check" ? inp.checked : t === "number" ? Number(inp.value) : inp.value;
  if (t === "paras") v = inp.value.split(/\n\s*\n/).map(x => x.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  if (t === "lines") v = inp.value.split(/\n/).map(x => x.trim()).filter(Boolean);
  if (t === "sectionid" || t === "projectid") { if (!commitOnly) return; return renameId(t, path, inp.value); }
  if (commitOnly) { if (t === "text" || t === "link") renderSideSoon(); return; }
  if (!inp.__snap) { snap(); inp.__snap = true; }
  setAt(path, v);
  if (t === "color") { const twin = $$(`[data-f="${path}"]`, $("#side")).find(x => x !== inp); if (twin) twin.value = v; }
  changed({ render: false }); paint(!final);
  if (final && (t === "check" || inp.tagName === "SELECT")) renderSide();
  if (final && t === "text" && inp.tagName === "SELECT" && /\.type$/.test(path)) { const b = getAt(path.replace(/\.type$/, "")); Object.assign(b, { ...BLOCKS[v].make(), ...b, type: v }); paint(); renderSide(); }
}
let rsT = 0;
function renderSideSoon() { clearTimeout(rsT); rsT = setTimeout(() => { if (!$("#side").contains(document.activeElement) || document.activeElement === document.body) renderSide(); }, 50); }
function renameId(kind, path, raw) {
  const old = getAt(path), list = kind === "projectid" ? C.projects : C.sections;
  const self = list.find(x => x.id === old);
  const id = uniqueId(raw || old, list, self);
  if (id === old) { renderSide(); return; }
  snap(); self.id = id;
  if (kind === "projectid") {
    for (const [o, k] of refLists()) o[k] = o[k].map(x => x === old ? id : x);
    for (const s of C.sections) for (const it of s.items || []) if (it.project === old) it.project = id;
    for (const p of C.projects) for (const r of p.related || []) if (r.project === old) r.project = id;
    if (selProject === old) selProject = id;
  } else {
    const fix = l => l && l.forEach(b => { if (b.link === "#" + old) b.link = "#" + id; });
    for (const s of C.sections) { fix(s.buttons); fix(s.links); }
    for (const k of ["announcement", "popup"]) { const o = C.site[k]; if (o) { if (o.link === "#" + old) o.link = "#" + id; if (o.buttonLink === "#" + old) o.buttonLink = "#" + id; } }
  }
  changed({ side: true }); toast("Link name updated.");
}

/* drag and drop for the sidebar lists */
function dnd(root, sel, attr, move) {
  let from = null;
  $$(sel, root).forEach(el => {
    el.addEventListener("dragstart", e => { from = +el.getAttribute(attr); el.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(from)); });
    el.addEventListener("dragend", () => { el.classList.remove("dragging"); $$(sel, root).forEach(x => x.classList.remove("drag-over", "drag-over-b")); });
    el.addEventListener("dragover", e => { if (from == null) return; e.preventDefault(); const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; $$(sel, root).forEach(x => x.classList.remove("drag-over", "drag-over-b")); el.classList.add(after ? "drag-over-b" : "drag-over"); });
    el.addEventListener("drop", e => {
      e.preventDefault(); if (from == null) return;
      const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      let to = +el.getAttribute(attr) + (after ? 1 : 0); if (from < to) to--;
      const f = from; from = null; if (to !== f) move(f, to);
    });
  });
}
function dndLists(root, sel, attr) {
  const groups = {};
  $$(sel, root).forEach(el => (groups[el.getAttribute(attr)] = groups[el.getAttribute(attr)] || []).push(el));
  for (const [path, els] of Object.entries(groups)) {
    let from = null;
    els.forEach(el => {
      el.addEventListener("dragstart", e => { if (e.target !== el) return; from = +el.dataset.k; e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", path); });
      el.addEventListener("dragend", () => els.forEach(x => x.classList.remove("drag-over", "drag-over-b")));
      el.addEventListener("dragover", e => { if (from == null) return; e.preventDefault(); e.stopPropagation(); const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; els.forEach(x => x.classList.remove("drag-over", "drag-over-b")); el.classList.add(after ? "drag-over-b" : "drag-over"); });
      el.addEventListener("drop", e => {
        if (from == null) return; e.preventDefault(); e.stopPropagation();
        const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        let to = +el.dataset.k + (after ? 1 : 0); if (from < to) to--;
        const f = from; from = null; if (to === f) return;
        snap(); const l = getAt(path); const [x] = l.splice(f, 1); l.splice(to, 0, x); changed({ side: true });
      });
    });
  }
  // only drag from the grip, so text fields inside stay selectable
  $$(sel, root).forEach(el => { el.draggable = false; const g = $(".grip", el); if (g) { g.addEventListener("mousedown", () => el.draggable = true); el.addEventListener("dragend", () => el.draggable = false); } });
}

/* ---------- projects ---------- */
function refLists() {
  const out = [];
  C.sections.forEach(s => { if (s.projects) out.push([s, "projects"]); (s.groups || []).forEach(g => out.push([g, "projects"])); });
  return out;
}
function newProject(refPath) {
  snap();
  const id = uniqueId("new-project", C.projects);
  const p = { id, title: "New Project", cardTitle: "New project", tag: "", meta: "Client · Format · Year", industry: "", quote: "", quote2: "", cardQuote: "", body: ["Write about the project here."], images: [] };
  C.projects.unshift(p);
  let target = refPath && Array.isArray(getAt(refPath)) ? getAt(refPath) : null;
  if (!target) { const first = refLists()[0]; if (first) target = first[0][first[1]]; }
  if (target) target.unshift(id);
  changed();
  W().Site.openProject(id, true);
  toast("New project added. Edit it on the right, and upload pictures on the left.");
}
async function projectAction(act) {
  const n = C.projects.findIndex(p => p.id === selProject), p = C.projects[n];
  if (act === "dup") {
    snap(); const c = clone(p); c.id = uniqueId(p.id + "-copy", C.projects); c.title += " (copy)"; c.cardTitle = (c.cardTitle || p.title) + " (copy)"; C.projects.splice(n + 1, 0, c);
    for (const [o, k] of refLists()) if (o[k].includes(p.id)) o[k].splice(o[k].indexOf(p.id) + 1, 0, c.id);
    changed(); W().Site.openProject(c.id, true); return;
  }
  if (act === "del") {
    if (!(await ask("Delete this project?", `“${esc(p.title)}” will be removed from every section. You can undo straight after.`, "Delete", true))) return;
    snap(); W().Site.closeProject(true);
    C.projects.splice(n, 1);
    for (const [o, k] of refLists()) o[k] = o[k].filter(x => x !== p.id);
    for (const s of C.sections) if (s.items) s.items = s.items.filter(x => x.project !== p.id);
    for (const q of C.projects) if (q.related) q.related = q.related.filter(r => r.project !== p.id);
    selProject = null; tab = "projects"; changed({ side: true }); toast("Project deleted. Press Undo to bring it back.");
  }
}

/* ---------- publishing ---------- */
let publishing = false;
async function publish() {
  if (publishing) return;
  if (!dirty) { toast("Nothing new to publish."); return; }
  const btn = $("#publish"); publishing = true; btn.disabled = true; btn.textContent = "Publishing…"; status("Saving to GitHub…");
  try {
    const cur = await gh(`${RP()}/contents/content.json?ref=${encodeURIComponent(REPO.branch)}`);
    if (cur.sha !== base.contentSha) {
      const ok = await ask("The site changed somewhere else", "Someone (maybe you, on another device) published since you opened the editor. Publishing now replaces that version with this one.", "Publish anyway", true);
      if (!ok) throw Object.assign(new Error("cancelled"), { quiet: true });
    }
    const ref = await gh(`${RP()}/git/ref/heads/${encodeURIComponent(REPO.branch)}`);
    const head = ref.object.sha, headCommit = await gh(`${RP()}/git/commits/${head}`);
    const json = JSON.stringify(C, null, 2) + "\n";
    const tree = [];
    let n = 0; const used = [...pending].filter(([path]) => json.includes(path));
    for (const [path, p] of used) {
      status(`Uploading pictures ${++n} of ${used.length}…`);
      const b = await gh(`${RP()}/git/blobs`, { method: "POST", body: { content: await blobB64(p.blob), encoding: "base64" } });
      tree.push({ path, mode: "100644", type: "blob", sha: b.sha });
    }
    status("Saving…");
    tree.push({ path: "content.json", mode: "100644", type: "blob", content: json });
    const t = await gh(`${RP()}/git/trees`, { method: "POST", body: { base_tree: headCommit.tree.sha, tree } });
    const c = await gh(`${RP()}/git/commits`, { method: "POST", body: { message: "Update the site from the editor", tree: t.sha, parents: [head] } });
    await gh(`${RP()}/git/refs/heads/${encodeURIComponent(REPO.branch)}`, { method: "PATCH", body: { sha: c.sha } });
    const f = await gh(`${RP()}/contents/content.json?ref=${encodeURIComponent(REPO.branch)}`);
    base = { json, contentSha: f.sha };
    pending.clear(); clearDraft(); dirty = false; status();
    toast("Published. Your live site updates in about a minute.", 5000);
  } catch (e) {
    status();
    if (!e.quiet) toast(e.status === 401 ? "GitHub didn’t accept the token. It may have expired: set up the editor again from the menu." : "Couldn’t publish: " + e.message, 6000);
  } finally { publishing = false; btn.disabled = false; btn.textContent = "Publish"; }
}

/* ---------- top bar ---------- */
function wireChrome() {
  $("#undo").onclick = undo; $("#redo").onclick = redo; $("#publish").onclick = publish;
  document.addEventListener("keydown", keys);
  $$("[data-device]").forEach(b => b.onclick = () => {
    $$("[data-device]").forEach(x => x.classList.toggle("on", x === b));
    $("#frameWrap").classList.toggle("mobile", b.dataset.device === "mobile");
  });
  $("#previewBtn").onclick = () => {
    previewing = !previewing; $("#previewBtn").classList.toggle("on", previewing); $("#editor").classList.toggle("previewing", previewing);
    const d = D(), css = $("#edcss", d); if (css) css.disabled = previewing;
    W().Site.mount(C, { edit: !previewing, resolve, onProject: previewing ? null : (id => { selProject = id; if (id) selSection = null; renderSide(); decorate(); }) });
    if (!previewing) { decorate(); renderSide(); }
    toast(previewing ? "Preview: this is how visitors see it. Click the eye again to keep editing." : "Back to editing.");
  };
  const menu = $("#menu");
  $("#menuBtn").onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener("click", e => { if (!e.target.closest("#menu")) menu.hidden = true; });
  menu.onclick = async e => {
    const a = e.target.closest("[data-act]"); if (!a) return; menu.hidden = true;
    if (a.dataset.act === "logout") { try { sessionStorage.removeItem("samlewis-editor-token"); } catch (x) {} location.reload(); }
    if (a.dataset.act === "export") { const b = new Blob([JSON.stringify(C, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const l = document.createElement("a"); l.href = u; l.download = `samlewis-content-${new Date().toISOString().slice(0, 10)}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
    if (a.dataset.act === "discard") {
      if (!dirty) return toast("There’s nothing unpublished to discard.");
      if (!(await ask("Discard unpublished changes?", "This puts everything back to how the live site is now.", "Discard", true))) return;
      snap(); C = JSON.parse(base.json); pending.clear(); clearDraft(); dirty = false; selProject = null; selSection = null; status(); W().Site.closeProject(true); paint(); renderSide();
    }
    if (a.dataset.act === "password") changePassword();
    if (a.dataset.act === "help") modal(`<div class="dialog-h"><h2>How editing works</h2><button class="ib" data-x aria-label="Close">${ICON.x}</button></div><div class="dialog-b"><ul class="help-list">
      <li><b>Words:</b> click any text on the page and type. Press Enter to finish a line.</li>
      <li><b>Pictures:</b> click a picture to replace it. Big photos are shrunk automatically.</li>
      <li><b>Sections:</b> hover a section for its toolbar: move it, change its colour, hide, duplicate or delete it. Drag sections in the list on the left to reorder them. Use “+ Add section” to add a new one.</li>
      <li><b>Projects:</b> click a project card to open and edit it. Add new ones from the Projects tab.</li>
      <li><b>Menu:</b> open a section’s settings and fill in “Show in the menu as”.</li>
      <li><b>Undo:</b> Ctrl or Cmd + Z. Your changes are saved in this browser as you go.</li>
      <li><b>Publish:</b> nothing changes on samlewis.fyi until you press Publish. It goes live about a minute later.</li></ul></div>`, "small");
  };
  addEventListener("beforeunload", e => { if (publishing) { e.preventDefault(); e.returnValue = ""; } });
}
function changePassword() {
  const { el, close } = modal(`<div class="dialog-h"><h2>Change password</h2><button class="ib" data-x aria-label="Close">${ICON.x}</button></div>
    <form class="dialog-b" id="cpf"><div class="field"><label for="cp1">New password</label><input type="password" id="cp1" minlength="10" required autocomplete="new-password"><p class="help">At least 10 characters.</p></div>
    <div class="field"><label for="cp2">Type it again</label><input type="password" id="cp2" required autocomplete="new-password"></div><div class="err" id="cperr"></div>
    <div><button class="btn-p">Save new password</button></div></form>`, "small");
  $("#cpf", el).onsubmit = async e => {
    e.preventDefault(); const a = $("#cp1", el).value, b = $("#cp2", el).value, er = $("#cperr", el);
    if (a.length < 10) return er.textContent = "Please use at least 10 characters.";
    if (a !== b) return er.textContent = "Those don’t match.";
    er.textContent = "Saving…";
    try { auth = await seal(token, a); await putFile("admin/auth.json", JSON.stringify(auth, null, 2) + "\n", "Change the editor password"); close(); toast("Password changed. Use the new one next time."); }
    catch (x) { er.textContent = "Couldn’t save: " + x.message; }
  };
}

boot();
})();
