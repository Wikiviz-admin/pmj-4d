/* PMJ 4D – v0.2
 * Trimble Connect 3D Viewer extension för PMJ Service.
 * Läser och skriver "Rakennusosan Status" via Trimble Property Set API
 * och färgar modellen efter status.
 */
"use strict";

// ---------- Statusfärger: PMJ-blått i processordning ----------
const STATUS_COLORS = {
  "HOLD":         "#d64545",
  "ODOTTAA":      "#b8c0c6",
  "SUUNNITELTU":  "#a6e9f2",
  "PIIRUSTUS OK": "#00c3dc",
  "TUOTANNOSSA":  "#00a7db",
  "VALMISTETTU":  "#006393",
  "ASENNETTU":    "#3aa845",
};
const NONE = "__none__";

// ---------- Texter (svenska / finska) ----------
const T = {
  sv: {
    setupTitle: "Inställningar", libId: "Bibliotekets ID (PMJ master library)", load: "Ladda",
    pset: "Property set", statusField: "Statusfält", linkTpl: "Länkmall",
    linkHint: "Sätt status för hand på ett objekt i Connect, markera det och klicka nedan.",
    discover: "Hitta från markerat objekt", region: "Region", done: "Klar",
    tabView: "Översikt", tabFill: "Fyll i", refresh: "Uppdatera", clear: "Rensa färger",
    emptyView: "Klicka på Uppdatera för att färga modellen efter status.",
    cardsHint: "Klicka på en status för att dölja eller visa den.",
    selected: "objekt markerade", dateField: "Datumfält", date: "Datum",
    live: "Spara på riktigt (annars bara provkörning)",
    save: (n) => `Spara på ${n} objekt`, test: (n) => `Provkör på ${n} objekt`,
    none: "Utan status", debug: "Felsökning", props: "Objektets egenskaper", copy: "Kopiera logg",
    clearLog: "Töm logg", token: "Ny token", needSetup: "Gör inställningarna först (⚙).",
    stOk: "Ansluten", stWait: "Väntar på åtkomst", stBad: "Ingen anslutning", settings: "Inställningar",
  },
  fi: {
    setupTitle: "Asetukset", libId: "Kirjaston tunnus (PMJ master library)", load: "Lataa",
    pset: "Ominaisuusjoukko", statusField: "Tilakenttä", linkTpl: "Linkkimalli",
    linkHint: "Aseta tila käsin yhdelle osalle Connectissa, valitse se ja klikkaa alla.",
    discover: "Hae valitusta osasta", region: "Alue", done: "Valmis",
    tabView: "Yleiskuva", tabFill: "Täytä", refresh: "Päivitä", clear: "Poista värit",
    emptyView: "Klikkaa Päivitä, niin malli väritetään tilan mukaan.",
    cardsHint: "Klikkaa tilaa piilottaaksesi tai näyttääksesi sen.",
    selected: "osaa valittu", dateField: "Päivämääräkenttä", date: "Päivämäärä",
    live: "Tallenna oikeasti (muuten vain koeajo)",
    save: (n) => `Tallenna ${n} osaan`, test: (n) => `Koeajo ${n} osaan`,
    none: "Ei tilaa", debug: "Vianetsintä", props: "Osan ominaisuudet", copy: "Kopioi loki",
    clearLog: "Tyhjennä loki", token: "Uusi token", needSetup: "Tee ensin asetukset (⚙).",
    stOk: "Yhdistetty", stWait: "Odottaa lupaa", stBad: "Ei yhteyttä", settings: "Asetukset",
  },
};
let LANG = "sv";
const t = (k, ...a) => { const v = T[LANG][k]; return typeof v === "function" ? v(...a) : v; };

// ---------- Tillstånd ----------
const S = {
  api: null, token: null, connected: false,
  def: null, props: {}, labels: {},
  psetIndex: null,     // Map(link -> props)
  groups: new Map(),   // status -> Map(modelId -> runtimeIds[])
  hidden: new Set(),   // dolda statusar
  pick: "",            // vald status i "Fyll i"
  selCount: 0,
};
const $ = (id) => document.getElementById(id);

// ---------- Logg ----------
function log(msg, cls) {
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString("sv-FI")}] ${typeof msg === "string" ? msg : short(msg)}`;
  $("log").appendChild(line);
  $("log").scrollTop = $("log").scrollHeight;
  if (cls === "e" && !String(msg).startsWith("←")) flash(String(msg));
}
function short(obj, max = 3000) {
  let s; try { s = JSON.stringify(obj, null, 1); } catch { s = String(obj); }
  return s && s.length > max ? s.slice(0, max) + ` … (${s.length} tecken)` : s;
}
function flash(msg) { const d = $("dot"); d.title = msg; }

// ---------- Inställningar ----------
const store = {
  get(k) { try { return localStorage.getItem("pmj4d." + k) || ""; } catch { return ""; } },
  set(k, v) { try { localStorage.setItem("pmj4d." + k, v); } catch { /* blockerad i iframe */ } },
};
function setupComplete() { return $("libId").value.trim() && $("defId").value && $("linkTpl").value.trim(); }

// ---------- IFC-GUID <-> UUID ----------
const IFC_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
function ifcToUuid(g) {
  let n = 0n;
  for (const c of g) n = n * 64n + BigInt(IFC_CHARS.indexOf(c));
  const h = n.toString(16).padStart(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function uuidToIfc(u) {
  const hex = String(u).replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
  let n = BigInt("0x" + hex); const out = [];
  for (let i = 0; i < 22; i++) { out.unshift(IFC_CHARS[Number(n % 64n)]); n /= 64n; }
  return out.join("");
}
function idForms(externalId) {
  const id = String(externalId);
  if (/^[0-9A-Za-z_$]{22}$/.test(id)) return { guid: id, uuid: ifcToUuid(id) };
  const g = uuidToIfc(id);
  return g ? { guid: g, uuid: ifcToUuid(g) } : { guid: id, uuid: id };
}
const buildLink = (tpl, f, modelId) => tpl.replaceAll("{guid}", f.guid).replaceAll("{uuid}", f.uuid).replaceAll("{modelId}", modelId);

// ---------- PSet API ----------
const psetBase = () => $("region").value.replace(/\/$/, "");
const encLink = (link) => encodeURIComponent(link).replace(/%3A/gi, ":");

async function pset(method, pathOrUrl, body) {
  if (!S.token) throw new Error("Ingen access token ännu – godkänn åtkomsten i Connect.");
  const url = /^https?:/.test(pathOrUrl) ? pathOrUrl : psetBase() + pathOrUrl;
  const init = { method, headers: { Authorization: `Bearer ${S.token}`, Accept: "application/json" } };
  if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
  log(`→ ${method} ${url}${body !== undefined ? "\n  " + short(body, 600) : ""}`, "r");
  let res;
  try { res = await fetch(url, init); } catch (e) { throw new Error(`Nätverks-/CORS-fel mot ${url}: ${e.message}`); }
  const text = await res.text();
  let data = text; try { data = text ? JSON.parse(text) : null; } catch { /* ej JSON */ }
  log(`← ${res.status} ${short(data, 1200)}`, res.ok ? "r" : "e");
  if (!res.ok) throw new Error(`HTTP ${res.status} från PSet API`);
  return data;
}
const itemsOf = (d) => Array.isArray(d) ? d : (d && (d.items || d.psets || d.defs || d.data || d.values)) || [];

async function psetAll(path) {
  const all = [], sep = path.includes("?") ? "&" : "?";
  let url = path + sep + "top=500";
  for (let i = 0; i < 200 && url; i++) {
    const d = await pset("GET", url);
    all.push(...itemsOf(d));
    const next = d && !Array.isArray(d) ? d.next : null;
    if (!next) break;
    url = /^https?:|^\//.test(next) ? next : path + sep + "top=500&skiptoken=" + encodeURIComponent(next);
  }
  return all;
}

// ---------- Definition ----------
function flattenI18n(i18n) {
  const flat = {};
  if (!i18n || typeof i18n !== "object") return flat;
  const vals = Object.values(i18n);
  const nested = vals.length && vals.every((v) => v && typeof v === "object");
  const src = nested ? (i18n.fi || i18n.en || vals[0]) : i18n;
  for (const [k, v] of Object.entries(src)) if (typeof v === "string") flat[k] = v;
  return flat;
}
const label = (k) => S.labels[`${k}.name`] || S.labels[`${k}.title`] || S.labels[`${k}.label`] || S.labels[k] || k;

async function loadLibrary() {
  const libId = $("libId").value.trim();
  if (!libId) return;
  store.set("libId", libId); store.set("region", $("region").value);
  const defs = await psetAll(`/libs/${encodeURIComponent(libId)}/defs`);
  fillSelect($("defId"), defs.map((d) => d.id || d.defId), (id) => (defs.find((d) => (d.id || d.defId) === id) || {}).name || id);
  const want = store.get("defId");
  const auto = defs.find((d) => (d.id || d.defId) === want) || defs.find((d) => /rakennusosan\s*status/i.test(d.name || ""));
  if (auto) $("defId").value = auto.id || auto.defId;
  log(`Hittade ${defs.length} property set-definitioner.`);
  if ($("defId").value) await loadDefinition();
}

async function loadDefinition() {
  const libId = $("libId").value.trim(), defId = $("defId").value;
  if (!defId) return;
  store.set("defId", defId);
  const def = await pset("GET", `/libs/${encodeURIComponent(libId)}/defs/${encodeURIComponent(defId)}`);
  S.def = def;
  S.props = (def && def.schema && def.schema.props) || (def && def.props) || {};
  S.labels = flattenI18n((def && (def.i18n || (def.schema && def.schema.i18n))) || {});
  S.psetIndex = null;
  const keys = Object.keys(S.props);
  const enumKeys = keys.filter((k) => Array.isArray(S.props[k].enum));
  const dateKeys = keys.filter((k) => /date/i.test((S.props[k].format || "") + (S.props[k].type || "")) || /päivä|pvm|date/i.test(k + " " + label(k)));
  fillSelect($("statusKey"), enumKeys.length ? enumKeys : keys, label);
  const saved = store.get("statusKey");
  const auto = enumKeys.includes(saved) ? saved : enumKeys.find((k) => /kokoonpanon/i.test(k + " " + label(k))) || enumKeys[0];
  if (auto) $("statusKey").value = auto;
  fillSelect($("dateKey"), dateKeys, label, "–");
  const savedDate = store.get("dateKey"); if (dateKeys.includes(savedDate)) $("dateKey").value = savedDate;
  renderStatusGrid();
  log(`Definition "${def && def.name}" laddad. Fält: ${keys.map((k) => `${label(k)} [${k}]`).join(", ")}`);
}

function fillSelect(sel, keys, lab, emptyText) {
  sel.innerHTML = "";
  if (emptyText !== undefined) sel.add(new Option(emptyText, ""));
  for (const k of keys) sel.add(new Option(lab(k), k));
}
function statusValues() {
  const p = S.props[$("statusKey").value];
  return (p && p.enum) || Object.keys(STATUS_COLORS);
}
function colorFor(value) {
  if (value == null || value === "" || value === NONE) return null;
  const v = String(value).toUpperCase();
  if (STATUS_COLORS[v]) return STATUS_COLORS[v];
  let h = 0; for (const c of v) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `#${((h & 0xffffff) | 0x404040).toString(16).padStart(6, "0")}`;
}
const statusName = (v) => v === NONE ? t("none") : (S.labels[`${$("statusKey").value}.enum.${v}`] || v);
function sortByProcess(list) {
  const order = Object.keys(STATUS_COLORS);
  const rank = (v) => v === NONE ? 999 : (order.indexOf(String(v).toUpperCase()) + 1 || 500);
  return list.slice().sort((a, b) => rank(a) - rank(b));
}

// ---------- Viewer ----------
async function readSelection() {
  const sel = await S.api.viewer.getSelection();
  const list = (sel || []).map((m) => ({ modelId: m.modelId, runtimeIds: m.objectRuntimeIds || [] })).filter((m) => m.runtimeIds.length);
  setSelCount(list.reduce((a, m) => a + m.runtimeIds.length, 0));
  return list;
}
function setSelCount(n) { S.selCount = n; $("selCount").textContent = n; renderWriteButton(); }

async function toExternalIds(modelId, runtimeIds) {
  const out = new Map();
  async function run(ids) {
    if (!ids.length) return;
    try {
      const ext = await S.api.viewer.convertToObjectIds(modelId, ids);
      ids.forEach((rid, i) => { if (ext[i]) out.set(rid, ext[i]); });
    } catch {
      if (ids.length === 1) return;
      const mid = Math.floor(ids.length / 2);
      await run(ids.slice(0, mid)); await run(ids.slice(mid));
    }
  }
  for (let i = 0; i < runtimeIds.length; i += 2000) await run(runtimeIds.slice(i, i + 2000));
  return out;
}
async function selectedObjects() {
  const out = [];
  for (const m of await readSelection()) {
    const ext = await toExternalIds(m.modelId, m.runtimeIds);
    for (const rid of m.runtimeIds) if (ext.has(rid)) out.push({ modelId: m.modelId, runtimeId: rid, forms: idForms(ext.get(rid)) });
  }
  return out;
}
const selectorFor = (byModel) => ({ modelObjectIds: [...byModel].map(([modelId, ids]) => ({ modelId, objectRuntimeIds: ids })) });

// ---------- Länkformat ----------
async function loadPsetIndex(force) {
  if (S.psetIndex && !force) return S.psetIndex;
  const libId = $("libId").value.trim(), defId = $("defId").value;
  if (!libId || !defId) throw new Error(t("needSetup"));
  const list = await psetAll(`/libs/${encodeURIComponent(libId)}/defs/${encodeURIComponent(defId)}/psets`);
  S.psetIndex = new Map();
  for (const p of list) if (p && p.link) S.psetIndex.set(p.link, p.props || {});
  log(`${S.psetIndex.size} objekt har property setet ifyllt.`);
  if (list[0]) log({ exempel_på_pset: list[0] });
  return S.psetIndex;
}

async function discoverLink() {
  const objs = await selectedObjects();
  if (!objs.length) { log("Markera ett objekt som redan har ett värde i property setet.", "e"); return; }
  const index = await loadPsetIndex(true);
  for (const o of objs) {
    const { guid, uuid } = o.forms;
    for (const link of index.keys()) {
      let tpl = null;
      if (link.includes(guid)) tpl = link.replace(guid, "{guid}");
      else if (link.toLowerCase().includes(uuid.toLowerCase())) tpl = link.replace(new RegExp(uuid, "i"), "{uuid}");
      else if (link.toLowerCase().includes(uuid.replace(/-/g, "").toLowerCase())) { log("Länken använder UUID utan bindestreck – behöver stöd i koden.", "e"); continue; }
      if (!tpl) continue;
      if (tpl.includes(o.modelId)) tpl = tpl.replace(o.modelId, "{modelId}");
      $("linkTpl").value = tpl; store.set("linkTpl", tpl);
      log(`✔ Länkformat: ${tpl}  (objekt ${guid}, länk ${link})`);
      if (/[0-9a-f]{20,}/i.test(tpl.replace(/\{\w+\}/g, ""))) log("Obs: mallen innehåller ett långt ID (fil/projekt?). Kontrollera att det inte ändras mellan modellversioner.", "e");
      return;
    }
  }
  log(`Ingen länk innehåller de markerade objektens GUID (${objs.map((o) => o.forms.guid).join(", ")}).`, "e");
}

async function showProps() {
  const sel = await readSelection();
  if (!sel.length) { log("Markera ett objekt först.", "e"); return; }
  const m = sel[0], rid = m.runtimeIds[0];
  const props = await S.api.viewer.getObjectProperties(m.modelId, [rid]);
  const ext = await toExternalIds(m.modelId, [rid]);
  log({ modelId: m.modelId, runtimeId: rid, externalId: ext.get(rid), egenskaper: props });
}

// ---------- Översikt ----------
async function colorModel() {
  const tpl = $("linkTpl").value.trim(), key = $("statusKey").value;
  if (!tpl || !key) { openSetup(true); log(t("needSetup"), "e"); return; }
  const index = await loadPsetIndex(true);
  const models = await S.api.viewer.getObjects();
  S.groups = new Map();
  for (const m of models || []) {
    const rids = (m.objects || []).map((o) => o.id);
    const ext = await toExternalIds(m.modelId, rids);
    for (const rid of rids) {
      if (!ext.has(rid)) continue;
      const props = index.get(buildLink(tpl, idForms(ext.get(rid)), m.modelId));
      const v = props && props[key] ? String(props[key]) : NONE;
      if (!S.groups.has(v)) S.groups.set(v, new Map());
      const byModel = S.groups.get(v);
      if (!byModel.has(m.modelId)) byModel.set(m.modelId, []);
      byModel.get(m.modelId).push(rid);
    }
  }
  await S.api.viewer.setObjectState(undefined, { color: "reset", visible: "reset" });
  for (const [v, byModel] of S.groups) {
    const color = colorFor(v);
    const state = {};
    if (color) state.color = color;
    if (S.hidden.has(v)) state.visible = false;
    if (Object.keys(state).length) await S.api.viewer.setObjectState(selectorFor(byModel), state);
  }
  renderCards();
}

async function toggleStatus(v) {
  const byModel = S.groups.get(v);
  if (!byModel) return;
  const hide = !S.hidden.has(v);
  hide ? S.hidden.add(v) : S.hidden.delete(v);
  await S.api.viewer.setObjectState(selectorFor(byModel), { visible: !hide });
  renderCards();
}

function renderCards() {
  const box = $("cards");
  box.innerHTML = "";
  const keys = sortByProcess([...S.groups.keys()]);
  for (const v of keys) {
    const n = [...S.groups.get(v).values()].reduce((a, ids) => a + ids.length, 0);
    const b = document.createElement("button");
    b.className = "card" + (S.hidden.has(v) ? " off" : "");
    b.style.setProperty("--c", colorFor(v) || "#d5dbe0");
    b.innerHTML = `<div class="n"></div><div class="t"></div>`;
    b.querySelector(".n").textContent = n;
    b.querySelector(".t").textContent = statusName(v);
    b.onclick = guard(() => toggleStatus(v));
    box.appendChild(b);
  }
  $("cardsEmpty").hidden = keys.length > 0;
  $("cardsHint").hidden = keys.length === 0;
}

// ---------- Fyll i ----------
function renderStatusGrid() {
  const grid = $("statusGrid");
  grid.innerHTML = "";
  for (const v of sortByProcess(statusValues())) {
    const b = document.createElement("button");
    b.className = "st" + (S.pick === v ? " on" : "");
    b.style.setProperty("--c", colorFor(v));
    b.innerHTML = "<i></i><span></span>";
    b.querySelector("span").textContent = statusName(v);
    b.onclick = () => { S.pick = S.pick === v ? "" : v; renderStatusGrid(); };
    grid.appendChild(b);
  }
  renderWriteButton();
}
function renderWriteButton() {
  const btn = $("btnWrite");
  btn.textContent = $("live").checked ? t("save", S.selCount) : t("test", S.selCount);
  btn.disabled = !S.selCount || (!S.pick && !($("dateKey").value && $("dateVal").value));
}

function formatDate(key, ymd) {
  if (S.psetIndex) for (const p of S.psetIndex.values()) {
    const v = p[key];
    if (typeof v === "string" && v) return /^\d{4}-\d{2}-\d{2}$/.test(v) ? ymd : `${ymd}T00:00:00.000Z`;
  }
  return (S.props[key] || {}).format === "date" ? ymd : `${ymd}T00:00:00.000Z`;
}

async function writeSelected() {
  const libId = $("libId").value.trim(), defId = $("defId").value, tpl = $("linkTpl").value.trim();
  if (!setupComplete()) { openSetup(true); log(t("needSetup"), "e"); return; }
  const props = {};
  if (S.pick) props[$("statusKey").value] = S.pick;
  const dk = $("dateKey").value, dv = $("dateVal").value;
  if (dk && dv) props[dk] = formatDate(dk, dv);
  if (!Object.keys(props).length) return;

  const objs = await selectedObjects();
  if (!objs.length) return;
  const live = $("live").checked;
  log(`${live ? "SPARAR" : "PROVKÖRNING"}: ${short(props, 300)} på ${objs.length} objekt.`);
  let ok = 0, fail = 0;
  const queue = objs.slice();
  async function worker() {
    while (queue.length) {
      const o = queue.shift();
      const path = `/psets/${encLink(buildLink(tpl, o.forms, o.modelId))}/${encodeURIComponent(libId)}/${encodeURIComponent(defId)}`;
      if (!live) { log(`(prov) PATCH ${psetBase()}${path}  ${short({ props }, 300)}`); ok++; continue; }
      try { await pset("PATCH", path, { props }); ok++; } catch (e) { fail++; log(`Fel för ${o.forms.guid}: ${e.message}`, "e"); }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  log(`Klart: ${ok} ok, ${fail} fel.`);
  if (!live) { openDebug(true); return; }
  S.psetIndex = null;
  if (S.groups.size) await colorModel();   // visa resultatet direkt
}

// ---------- UI-skal ----------
function applyLang() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  $("btnLang").textContent = LANG === "sv" ? "FI" : "SV";
  $("btnSetup").title = t("settings");
  renderStatusGrid(); renderCards(); setDot();
}
function setDot() {
  const d = $("dot");
  if (S.connected && S.token) { d.className = "dot ok"; d.title = t("stOk"); }
  else if (S.connected) { d.className = "dot"; d.title = t("stWait"); }
  else { d.className = "dot bad"; d.title = t("stBad"); }
}
const openSetup = (on) => { $("setup").hidden = !on; };
const openDebug = (on) => { $("debug").hidden = !on; };
function showTab(fill) {
  $("tabView").classList.toggle("on", !fill); $("tabFill").classList.toggle("on", fill);
  $("paneView").hidden = fill; $("paneFill").hidden = !fill;
  if (fill && S.api) guard(readSelection)();
}

function onEvent(event, data) {
  if (event === "extension.accessToken") {
    if (data && data !== "pending" && data !== "denied") { const first = !S.token; S.token = data; if (first) afterToken(); }
    setDot(); return;
  }
  if (event === "viewer.onSelectionChanged") {
    setSelCount(Array.isArray(data) ? data.reduce((a, m) => a + ((m.objectRuntimeIds || []).length), 0) : 0);
    return;
  }
  log(`händelse: ${event}`);
}
async function afterToken() {
  if (!S.def && $("libId").value.trim()) await guard(loadLibrary)();
  if (!setupComplete()) openSetup(true);
}
async function requestToken() {
  const r = await S.api.extension.requestPermission("accesstoken");
  if (r && r !== "pending" && r !== "denied") { const first = !S.token; S.token = r; if (first) await afterToken(); }
  if (r === "denied") log("Åtkomst nekad. Återställ i extensionens inställningar i Connect.", "e");
  setDot();
}
function guard(fn) {
  return async (ev) => {
    const btn = ev && ev.currentTarget;
    if (btn && btn.tagName === "BUTTON") btn.disabled = true;
    try { await fn(); } catch (e) { log(e.message || String(e), "e"); }
    finally { if (btn && btn.tagName === "BUTTON") btn.disabled = false; if (btn === $("btnWrite")) renderWriteButton(); }
  };
}

async function init() {
  LANG = store.get("lang") || "sv";
  for (const k of ["region", "libId", "linkTpl"]) { const v = store.get(k); if (v) $(k).value = v; }
  $("btnLang").onclick = () => { LANG = LANG === "sv" ? "fi" : "sv"; store.set("lang", LANG); applyLang(); };
  $("btnSetup").onclick = () => openSetup($("setup").hidden);
  $("btnSetupDone").onclick = () => openSetup(false);
  $("btnDebug").onclick = () => openDebug($("debug").hidden);
  $("tabView").onclick = () => showTab(false);
  $("tabFill").onclick = () => showTab(true);
  $("btnLib").onclick = guard(loadLibrary);
  $("defId").onchange = guard(loadDefinition);
  $("statusKey").onchange = () => { store.set("statusKey", $("statusKey").value); S.pick = ""; renderStatusGrid(); };
  $("dateKey").onchange = () => { store.set("dateKey", $("dateKey").value); renderWriteButton(); };
  $("dateVal").oninput = renderWriteButton;
  $("live").onchange = renderWriteButton;
  $("linkTpl").onchange = () => store.set("linkTpl", $("linkTpl").value.trim());
  $("region").onchange = () => store.set("region", $("region").value);
  $("btnDiscover").onclick = guard(discoverLink);
  $("btnProps").onclick = guard(showProps);
  $("btnColor").onclick = guard(colorModel);
  $("btnReset").onclick = guard(async () => {
    await S.api.viewer.setObjectState(undefined, { color: "reset", visible: "reset" });
    S.groups = new Map(); S.hidden.clear(); renderCards();
  });
  $("btnWrite").onclick = guard(writeSelected);
  $("btnClear").onclick = () => { $("log").innerHTML = ""; };
  $("btnToken").onclick = guard(requestToken);
  $("btnCopy").onclick = () => {
    const text = $("log").innerText;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .catch(() => { const r = document.createRange(); r.selectNodeContents($("log")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy"); })
      .then(() => log("Loggen kopierad."));
  };
  applyLang();

  if (!window.TrimbleConnectWorkspace) { log("Workspace API-skriptet kunde inte laddas.", "e"); return; }
  try {
    S.api = await TrimbleConnectWorkspace.connect(window.parent, onEvent, 30000);
    S.connected = true; setDot();
    try { const p = await S.api.project.getProject(); log(`Projekt: ${p && p.name} (${p && p.id})`); } catch { /* valfritt */ }
    await requestToken();
    if (!S.token) openSetup(!setupComplete());
  } catch (e) {
    setDot();
    log(`Kunde inte ansluta till Connect: ${e.message}. Körs sidan inuti Connects 3D-visare?`, "e");
  }
}

init();
