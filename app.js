/* PMJ 4D – v1.0
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
    autoDates: "Fyll i dagens datum automatiskt (bara om fältet är tomt)",
    weekHint: (f, w) => `${f}: ${w} (räknas ut automatiskt)`,
    autoNoteToday: "Idag – fylls bara i där fältet är tomt.", autoNoteSet: "Skrivs på alla markerade element.",
    brush: "🖌 Penselläge – klicka på element i 3D", brushTest: "🖌 Penselläge (provkörning)",
    brushOn: (n) => `🖌 Pensel på · ${n} sparade · klicka för att stänga`, pickFirst: "🖌 Välj en status först",
    tab4d: "4D", modeSite: "Montage", modeChain: "Hela kedjan", today: "Idag", play: "▶ Spela upp", pause: "❚❚ Pausa",
    wk: "Vecka", lgPlanned: "planerat", lgInstalled: "monterat", reload: "↻ Läs in på nytt",
    stInstalled: "Monterade", stLate: "Försenade", stUpcoming: "Kommande", stSent: "Ritningar skickade",
    stMade: "Tillverkade", stWaiting: "Ej påbörjade", showUpcoming: "Visa kommande element i grått",
    emptyTl: "Inga datum att visa än. Fyll i Suunniteltu Asennuspäivä eller sätt status med automatiska datum.",
    loadTl: "Läser in…",
    infoNone: "Markera ett element i 3D för att se dess uppgifter.", infoMulti: (n) => `${n} element markerade`,
    noMark: "Inget elementnummer", cfgMark: "Elementnummer hämtas från", cfgFields: "Visa i korten (max 5)",
    modelGroup: "Modellen", cfgPick: "Markera ett element för att se modellens egenskaper.", wkShort: "v",
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
    autoDates: "Täytä tämä päivä automaattisesti (vain jos kenttä on tyhjä)",
    weekHint: (f, w) => `${f}: ${w} (lasketaan automaattisesti)`,
    autoNoteToday: "Tänään – täytetään vain, jos kenttä on tyhjä.", autoNoteSet: "Kirjoitetaan kaikkiin valittuihin osiin.",
    brush: "🖌 Sivellintila – klikkaa osia 3D:ssä", brushTest: "🖌 Sivellintila (koeajo)",
    brushOn: (n) => `🖌 Sivellin päällä · ${n} tallennettu · sulje klikkaamalla`, pickFirst: "🖌 Valitse ensin tila",
    tab4d: "4D", modeSite: "Asennus", modeChain: "Koko ketju", today: "Tänään", play: "▶ Toista", pause: "❚❚ Tauko",
    wk: "Viikko", lgPlanned: "suunniteltu", lgInstalled: "asennettu", reload: "↻ Lue uudelleen",
    stInstalled: "Asennettu", stLate: "Myöhässä", stUpcoming: "Tulossa", stSent: "Piirustukset lähetetty",
    stMade: "Valmistettu", stWaiting: "Aloittamatta", showUpcoming: "Näytä tulevat osat harmaana",
    emptyTl: "Ei vielä päivämääriä. Täytä Suunniteltu Asennuspäivä tai aseta tila automaattisilla päivämäärillä.",
    loadTl: "Luetaan…",
    infoNone: "Valitse osa 3D:ssä nähdäksesi sen tiedot.", infoMulti: (n) => `${n} elementtiä valittu`,
    noMark: "Ei elementtitunnusta", cfgMark: "Elementtitunnus haetaan kentästä", cfgFields: "Näytä korteissa (max 5)",
    modelGroup: "Malli", cfgPick: "Valitse osa nähdäksesi mallin ominaisuudet.", wkShort: "vk",
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
  fields: {},          // upptäckta fältnycklar: sent, made, installed, plannedDate, plannedWeek
  brush: { on: false, timer: null, sig: "", done: new Set(), count: 0, busy: false },
};

// Vilket datumfält som fylls i automatiskt för en viss status
const AUTO_DATE_FOR = { "PIIRUSTUS OK": "sent", "VALMISTETTU": "made", "ASENNETTU": "installed" };
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
  get(k) { try { return localStorage.getItem("pmj4d." + skey(k)) || ""; } catch { return ""; } },
  set(k, v) { try { localStorage.setItem("pmj4d." + skey(k), v); } catch { /* blockerad i iframe */ } },
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
S.fileIds = new Map();   // viewerns modelId (= versionId) -> filens id (oförändrat mellan versioner)
const buildLink = (tpl, f, modelId) => tpl.replaceAll("{guid}", f.guid).replaceAll("{uuid}", f.uuid)
  .replaceAll("{fileId}", S.fileIds.get(modelId) || modelId).replaceAll("{modelId}", modelId);

/** Hämta fil-ID för laddade modeller. */
async function loadFileIds() {
  try {
    for (const m of (await S.api.viewer.getModels("loaded")) || []) {
      if (m.versionId) S.fileIds.set(m.versionId, m.id);
      if (m.id) S.fileIds.set(m.id, m.id);
    }
  } catch (e) { log(`Kunde inte läsa modellistan: ${e.message}`, "e"); }
}
/** Byt ut ett inbakat fil-/versions-ID i länkmallen mot en platshållare. */
function generalizeTemplate(tpl, modelId) {
  const fileId = S.fileIds.get(modelId);
  if (fileId && tpl.includes(fileId)) return tpl.split(fileId).join("{fileId}");
  if (modelId && tpl.includes(modelId)) return tpl.split(modelId).join("{modelId}");
  for (const [ver, id] of S.fileIds) {                    // mall från en annan modell/version
    if (tpl.includes(id)) return tpl.split(id).join("{fileId}");
    if (tpl.includes(ver)) return tpl.split(ver).join("{modelId}");
  }
  return tpl;
}
/** Uppgradera en sparad mall som fortfarande har ett fast ID. */
function upgradeTemplate() {
  const tpl = $("linkTpl").value.trim();
  if (!tpl || /\{(fileId|modelId)\}/.test(tpl)) return;
  const g = generalizeTemplate(tpl, null);
  if (g !== tpl) { $("linkTpl").value = g; store.set("linkTpl", g); log(`Länkmallen gjordes modelloberoende: ${g}`); }
}

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
const squash = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function isoWeek(ymd) {
  const d = new Date(ymd + "T12:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;            // mån = 0
  d.setUTCDate(d.getUTCDate() - day + 3);          // torsdag samma vecka
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - firstThu) / 864e5 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}
function todayYmd() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
const label = (k) => (S.labelMap && S.labelMap[k]) || S.labels[`${k}.name`] || S.labels[`${k}.title`] || S.labels[`${k}.label`] || S.labels[k] || k;

/** Leta igenom hela definitionen efter en läsbar rubrik för varje intern nyckel (prop_xxx). */
function buildLabelMap(def, keys) {
  const hits = {};                      // key -> [{score, text}]
  const NAMEISH = /^(name|title|label|displayname|caption|text)$/i;
  const LANG = /^[a-z]{2}([-_][a-z]{2})?$/i;
  (function walk(node, path) {
    if (node == null) return;
    if (typeof node === "string") {
      for (let i = 0; i < path.length; i++) {
        const k = path[i];
        if (!keys.includes(k)) continue;
        const next = path[i + 1];
        let score = 0;
        if (i === path.length - 1) score = 3;                              // {..., prop_x: "Rubrik"}
        else if (next && NAMEISH.test(next) && i + 2 === path.length) score = 3;   // prop_x.name
        else if (next && LANG.test(next) && i + 2 === path.length) score = 3;      // prop_x.fi
        else if (next && NAMEISH.test(next) && LANG.test(path[i + 2] || "") && i + 3 === path.length) score = 3; // prop_x.name.fi
        else if (next && /^description$/i.test(next) && i + 2 === path.length) score = 1;
        const p = path.join(".");
        if (/\benum\b/i.test(p)) score = 0;
        if (!score) continue;
        if (/(^|\.)fi(\.|$)/.test(p)) score += 0.5; else if (/(^|\.)en(\.|$)/.test(p)) score += 0.2;
        (hits[k] = hits[k] || []).push({ score, text: node });
      }
      // i18n-nycklar som "prop_x.name" i ett platt objekt
      const last = path[path.length - 1] || "";
      const m = last.match(/^(.+?)\.(name|title|label)$/i);
      if (m && keys.includes(m[1])) (hits[m[1]] = hits[m[1]] || []).push({ score: 3.4, text: node });
      return;
    }
    if (typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, path.concat(k));
  })(def, []);
  const map = {};
  for (const k of keys) {
    const best = (hits[k] || []).filter((h) => h.text && h.text !== k && !/^(string|number|integer|boolean|date|date-time|array|object)$/i.test(h.text))
      .sort((a, b) => b.score - a.score)[0];
    if (best) map[k] = best.text;
  }
  return map;
}

/** PMJ-fälten: först via rubrik, annars via ordningen i PMJ-biblioteket. */
function detectFields(keys) {
  const find = (re) => keys.find((k) => re.test(squash(label(k))) || re.test(squash(k)));
  const f = {
    sent: find(/^piirustu(kset|s)lahetetty/),
    made: find(/^valmistuspaivamaara/),
    installed: find(/^asennuspaivamaara/),
    plannedDate: find(/^suunniteltuasennuspaiva/),
    plannedWeek: find(/^suunniteltuasennusviikko/),
  };
  const isDate = (k) => /date/i.test(`${S.props[k].format || ""} ${S.props[k].type || ""}`);
  const isNum = (k) => /number|integer/i.test(S.props[k].type || "");
  const dates = keys.filter(isDate), nums = keys.filter(isNum);
  if (!f.sent && !f.made && !f.installed && !f.plannedDate && dates.length === 4) {
    // PMJ master library: Piirustukset Lähetetty, Valmistuspäivämäärä, Suunniteltu Asennuspäivä, Asennuspäivämäärä
    [f.sent, f.made, f.plannedDate, f.installed] = dates;
    if (!f.plannedWeek && nums.length === 1) f.plannedWeek = nums[0];
    f.byOrder = true;
    log("Obs: fältens rubriker hittades inte i definitionen – använder ordningen i PMJ-biblioteket. Kontrollera i Connect att datumen hamnar rätt.", "e");
  }
  return f;
}

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
  S.labelMap = buildLabelMap(def, keys);
  log(`Hela definitionen (för felsökning): ${short(def, 20000)}`);
  const enumKeys = keys.filter((k) => Array.isArray(S.props[k].enum));
  fillSelect($("statusKey"), enumKeys.length ? enumKeys : keys, label);
  const saved = store.get("statusKey");
  const auto = enumKeys.includes(saved) ? saved : enumKeys.find((k) => /kokoonpanon/i.test(k + " " + label(k))) || enumKeys[0];
  if (auto) $("statusKey").value = auto;
  S.fields = detectFields(keys);
  log({ upptäckta_fält: Object.fromEntries(Object.entries(S.fields).map(([k, v]) => [k, v && v !== true ? `${label(v)} [${v}]` : v])) });
  $("plannedLabel").textContent = S.fields.plannedDate ? (S.fields.byOrder ? "Suunniteltu Asennuspäivä" : label(S.fields.plannedDate)) : t("date");
  $("plannedRow").hidden = !S.fields.plannedDate;
  renderStatusGrid();
  if (S.api) refreshInfo();
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
/** Markerade objekt → deras element (cast unit). Status sparas alltid på elementnivå. */
async function toElements(list /* [{modelId, runtimeIds}] */) {
  const models = [];
  for (const m of list) {
    if (!S.structDone.has(m.modelId)) {
      const all = ((await S.api.viewer.getObjects()) || []).find((x) => x.modelId === m.modelId);
      models.push({ modelId: m.modelId, rids: all ? (all.objects || []).map((o) => o.id) : m.runtimeIds });
    }
  }
  if (models.length) await loadStructure(models);
  const out = [];
  for (const m of list) {
    const els = [...new Set(m.runtimeIds.map((r) => topElement(m.modelId, r)).filter((r) => !S.containers.has(K(m.modelId, r))))];
    const ext = await toExternalIds(m.modelId, els);
    for (const r of els) if (ext.has(r)) out.push({ modelId: m.modelId, runtimeId: r, forms: idForms(ext.get(r)) });
  }
  return out;
}
async function selectedElements() {
  const sel = await readSelection();
  const els = await toElements(sel);
  const n = sel.reduce((a, m) => a + m.runtimeIds.length, 0);
  if (els.length !== n) log(`${n} markerade objekt → ${els.length} element.`);
  return els;
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
      await loadFileIds();
      tpl = generalizeTemplate(tpl, o.modelId);
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

// ---------- Modellstruktur: behållare → element (cast unit) → delar ----------
// Connect döljer allt under ett dolt objekt. Därför styrs färg och synlighet ALLTID på
// "löv" (objekt utan barn = det man ser), aldrig på element, våningar eller andra behållare.
const ELEMENT_ASSEMBLY = 4;                       // HierarchyType.ElementAssembly
const CONTAINER_TYPES = [1, 2, 3, 5, 6, 7];       // spatial hierarki/innehåll, grupper, system, zoner
S.kids = new Map();        // "m:element" -> [alla underliggande objekt]
S.partOf = new Map();      // "m:del" -> närmaste element-rid
S.asm = new Set();         // "m:id" för element/assemblies (har delar)
S.containers = new Set();  // "m:id" för behållare (våning, byggnad …)
S.structDone = new Set();  // modelId som är inlästa
const K = (m, r) => m + ":" + r;
const addTo = (map, modelId, rid) => { if (!map.has(modelId)) map.set(modelId, []); map.get(modelId).push(rid); };

async function hierParents(modelId, ids, type) {
  const out = [];
  for (let i = 0; i < ids.length; i += 5000) {
    try { out.push(...((await S.api.viewer.getHierarchyParents(modelId, ids.slice(i, i + 5000), type, false, false)) || [])); }
    catch { /* typen finns inte i modellen */ }
  }
  return out.map((p) => p.id);
}
/** Läs delarna under ett antal element (parallellt). Provar assembly-hierarkin först. */
async function loadChildren(modelId, elementIds) {
  const queue = elementIds.filter((r) => !S.kids.has(K(modelId, r)));
  if (!queue.length) return;
  async function worker() {
    while (queue.length) {
      const r = queue.shift();
      let ch = [];
      for (const type of [ELEMENT_ASSEMBLY, 1, 3]) {
        try { ch = ((await S.api.viewer.getHierarchyChildren(modelId, [r], type, true)) || []).map((c) => c.id).filter((id) => id !== r); }
        catch { ch = []; }
        if (ch.length) break;
      }
      S.kids.set(K(modelId, r), ch);
      if (ch.length) S.asm.add(K(modelId, r));
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
}
function rebuildPartOf() {
  S.partOf = new Map();
  // Minsta element vinner (= närmaste förälder vid nästlade assemblies)
  const list = [...S.kids].filter(([, ch]) => ch.length).sort((a, b) => b[1].length - a[1].length);
  for (const [key, ch] of list) {
    const [m, r] = [key.slice(0, key.lastIndexOf(":")), Number(key.slice(key.lastIndexOf(":") + 1))];
    for (const c of ch) S.partOf.set(K(m, c), r);
  }
}
/** Läs in struktur för modellerna en gång. statusKeys = objekt som har ett sparat värde. */
async function loadStructure(models, statusKeys) {
  let changed = false;
  for (const { modelId, rids } of models) {
    if (!S.structDone.has(modelId)) {
      const asm = new Set(await hierParents(modelId, rids, ELEMENT_ASSEMBLY));
      for (const type of CONTAINER_TYPES) for (const id of await hierParents(modelId, rids, type)) if (!asm.has(id)) S.containers.add(K(modelId, id));
      if (asm.size) log(`Läser in ${asm.size} elements delar…`);
      await loadChildren(modelId, [...asm]);
      S.structDone.add(modelId); changed = true;
    }
    // Reserv: om viewern inte svarar på "förälder", fråga objekten med sparad status efter delar
    if (statusKeys && !S.probed) S.probed = new Set();
    if (statusKeys && !S.probed.has(modelId)) {
      S.probed.add(modelId);
      const cand = rids.filter((r) => statusKeys.has(K(modelId, r)) && !S.kids.has(K(modelId, r)) && !S.containers.has(K(modelId, r)) && !S.partOf.has(K(modelId, r)));
      let probe = [];
      if (cand.length) { try { probe = (await S.api.viewer.getHierarchyChildren(modelId, cand.slice(0, 2000), ELEMENT_ASSEMBLY, true)) || []; } catch { probe = []; } }
      if (probe.length) { await loadChildren(modelId, cand); changed = true; }
    }
    // Behållare som ändå har en sparad status (status satt på fel nivå) behandlas som element
    const odd = rids.filter((r) => statusKeys && statusKeys.has(K(modelId, r)) && S.containers.has(K(modelId, r)) && !S.kids.has(K(modelId, r)));
    if (odd.length) { await loadChildren(modelId, odd); odd.forEach((r) => S.containers.delete(K(modelId, r))); changed = true; }
  }
  if (changed) rebuildPartOf();
}
// Endast en inläsning åt gången (markeringen kan ändras medan strukturen läses)
{
  const inner = loadStructure;
  loadStructure = (...args) => (S.structLock = (S.structLock || Promise.resolve()).then(() => inner(...args), () => inner(...args)));
}
const isLeaf = (m, r) => !S.asm.has(K(m, r)) && !S.containers.has(K(m, r));
/** Översta elementet ett objekt hör till (eller objektet självt). */
function topElement(m, r) {
  let cur = r, guard = 0;
  while (S.partOf.has(K(m, cur)) && guard++ < 20) cur = S.partOf.get(K(m, cur));
  return cur;
}
/** Synliga löv under ett element (eller objektet självt om det saknar delar). */
function leavesOf(m, r) {
  const ch = S.kids.get(K(m, r));
  if (!ch || !ch.length) return S.containers.has(K(m, r)) ? [] : [r];
  return ch.filter((c) => isLeaf(m, c));
}
function leavesMap(byModel) {
  const out = new Map();
  for (const [m, ids] of byModel) { const all = []; for (const r of ids) all.push(...leavesOf(m, r)); out.set(m, all); }
  return out;
}

/** Statusfältets standardvärde i biblioteket (t.ex. ODOTTAA), om ett sådant finns. */
function statusDefault() {
  const p = S.props[$("statusKey").value] || {};
  const d = p.default ?? p.defaultValue ?? (p.defaults && p.defaults[0]);
  return d != null && d !== "" ? String(d) : null;
}
/** Logga hur väl länkmallen passar de sparade värdena – avslöjar fel mall direkt. */
function diagnoseLinks(index, tpl, matched, defaulted, def) {
  const esc = tpl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{(guid|uuid|fileId|modelId)\\\}/g, ".+?");
  const re = new RegExp("^" + esc + "$");
  const links = [...index.keys()];
  const misfit = links.filter((l) => !re.test(l));
  log(`Länkkontroll: ${index.size} sparade värden, ${matched} hittade i öppna modeller, ${misfit.length} passar inte mallen ${tpl}` +
    (def ? `; ${defaulted} objekt utan sparat värde räknas som ${def}.` : "; inget standardvärde i biblioteket."));
  if (misfit.length) log({ exempel_som_inte_passar: misfit.slice(0, 5) }, "e");
  if (index.size && !matched) log("Inga sparade värden hittades i de öppna modellerna – länkmallen stämmer troligen inte. Öppna ⚙ och klicka 'Hitta från markerat objekt' på ett element med sparad status.", "e");
}

async function colorModel() {
  if (S.tl) S.tl.painted = false;
  let tpl = $("linkTpl").value.trim();
  const key = $("statusKey").value;
  if (!tpl || !key) { openSetup(true); log(t("needSetup"), "e"); return; }
  await loadFileIds(); upgradeTemplate(); tpl = $("linkTpl").value.trim();
  const index = await loadPsetIndex(true);
  const models = ((await S.api.viewer.getObjects()) || []).map((m) => ({ modelId: m.modelId, rids: (m.objects || []).map((o) => o.id) }));
  // 1) Sparade värden per objekt
  const saved = new Map();
  let matched = 0;
  for (const { modelId, rids } of models) {
    const ext = await toExternalIds(modelId, rids);
    for (const r of rids) {
      const props = ext.has(r) ? index.get(buildLink(tpl, idForms(ext.get(r)), modelId)) : null;
      if (props) matched++;
      if (props && props[key]) saved.set(K(modelId, r), String(props[key]));
    }
  }
  // 2) Struktur: element, delar, behållare
  await loadStructure(models, new Set(saved.keys()));
  // 3) Varje synligt löv får sin egen status, annars närmaste överordnade elements, annars standardvärdet.
  //    "Ägaren" är objektet som bestämmer statusen – det är dem vi räknar.
  const def = statusDefault();
  S.groups = new Map(); S.leafGroups = new Map(); S.leafInfo = new Map();
  let defaulted = 0, mixed = 0;
  const owned = new Map();   // status -> Set("m:ägare")
  for (const { modelId, rids } of models) for (const r of rids) {
    if (!isLeaf(modelId, r)) continue;
    let cur = r, owner = null, v = null, guard = 0;
    while (cur != null && guard++ < 20) {
      const sv = saved.get(K(modelId, cur));
      if (sv) { owner = cur; v = sv; break; }
      cur = S.partOf.has(K(modelId, cur)) ? S.partOf.get(K(modelId, cur)) : null;
    }
    if (!v) { owner = topElement(modelId, r); v = def || NONE; if (def) defaulted++; }
    const top = topElement(modelId, r);
    if (owner !== top && saved.has(K(modelId, top)) && saved.get(K(modelId, top)) !== v) mixed++;
    S.leafInfo.set(K(modelId, r), { owner, status: v });
    if (!S.leafGroups.has(v)) S.leafGroups.set(v, new Map());
    addTo(S.leafGroups.get(v), modelId, r);
    if (!owned.has(v)) owned.set(v, new Set());
    const ok = K(modelId, owner);
    if (!owned.get(v).has(ok)) { owned.get(v).add(ok); if (!S.groups.has(v)) S.groups.set(v, new Map()); addTo(S.groups.get(v), modelId, owner); }
  }
  diagnoseLinks(index, tpl, matched, defaulted, def);
  log(`Struktur: ${S.asm.size} element med delar, ${S.containers.size} behållare (byggnad/våningar) lämnas orörda.`);
  if (mixed) log(`Obs: ${mixed} delar har en annan sparad status än sitt element (status sparad på delnivå). De visas med delens egen status. Ny sparning från appen sker alltid på elementet.`, "e");
  // 4) Färg och synlighet – bara på löv
  await S.api.viewer.setObjectState(undefined, { color: "reset", visible: "reset" });
  for (const [v, byModel] of S.leafGroups) {
    const color = colorFor(v);
    const state = {};
    if (color) state.color = color;
    if (S.hidden.has(v)) state.visible = false;
    if (Object.keys(state).length) await S.api.viewer.setObjectState(selectorFor(byModel), state);
  }
  renderCards();
}

async function toggleStatus(v) {
  const leaves = S.leafGroups && S.leafGroups.get(v);
  if (!leaves) return;
  const hide = !S.hidden.has(v);
  hide ? S.hidden.add(v) : S.hidden.delete(v);
  await S.api.viewer.setObjectState(selectorFor(leaves), { visible: !hide });
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
    b.onclick = () => {
      S.pick = S.pick === v ? "" : v;
      if (!S.pick && S.brush.on) stopBrush();
      $("autoDate").value = todayYmd();          // varje nytt statusval börjar med dagens datum
      renderStatusGrid();
    };
    grid.appendChild(b);
  }
  renderAutoHint();
  renderWriteButton();
}
function renderAutoHint() {
  const auto = autoDateKey(S.pick);
  $("autoRow").hidden = !auto;
  if (auto) {
    $("autoLabel").textContent = fieldName(auto);
    const v = $("autoDate").value;
    $("autoNote").textContent = !v ? "" : v === todayYmd() ? t("autoNoteToday") : t("autoNoteSet");
  }
  const dv = $("dateVal").value;
  $("weekHint").hidden = !(dv && S.fields.plannedWeek);
  if (dv && S.fields.plannedWeek) $("weekHint").textContent = t("weekHint", fieldName(S.fields.plannedWeek), isoWeek(dv));
}
function renderWriteButton() {
  const btn = $("btnWrite");
  btn.textContent = $("live").checked ? t("save", S.selCount) : t("test", S.selCount);
  btn.disabled = S.brush.on || !S.selCount || (!S.pick && !(S.fields.plannedDate && $("dateVal").value));
  const br = $("btnBrush");
  br.classList.toggle("on", S.brush.on);
  br.disabled = !S.brush.on && !S.pick;
  br.textContent = S.brush.on ? t("brushOn", S.brush.count) : !S.pick ? t("pickFirst") : $("live").checked ? t("brush") : t("brushTest");
}
const FIELD_NAMES = { sent: "Piirustukset Lähetetty", made: "Valmistuspäivämäärä", installed: "Asennuspäivämäärä", plannedDate: "Suunniteltu Asennuspäivä", plannedWeek: "Suunniteltu Asennusviikko" };
function fieldName(key) {
  const role = Object.keys(FIELD_NAMES).find((r) => S.fields[r] === key);
  const l = label(key);
  return l !== key ? l : (role ? FIELD_NAMES[role] : key);
}
const autoDateKey = (status) => S.fields[AUTO_DATE_FOR[String(status || "").toUpperCase()]] || null;

function formatDate(key, ymd) {
  if (S.psetIndex) for (const p of S.psetIndex.values()) {
    const v = p[key];
    if (typeof v === "string" && v) return /^\d{4}-\d{2}-\d{2}$/.test(v) ? ymd : `${ymd}T00:00:00.000Z`;
  }
  return (S.props[key] || {}).format === "date" ? ymd : `${ymd}T00:00:00.000Z`;
}

/** Bygg värdena för ett objekt. Automatiska datum skriver aldrig över ett befintligt datum. */
function propsFor(existing) {
  const props = {};
  if (S.pick) props[$("statusKey").value] = S.pick;
  const dk = S.fields.plannedDate, dv = $("dateVal").value;
  if (dk && dv) {
    props[dk] = formatDate(dk, dv);
    if (dk === S.fields.plannedDate && S.fields.plannedWeek) props[S.fields.plannedWeek] = isoWeek(dv);
  }
  const auto = autoDateKey(S.pick), av = $("autoDate").value;
  if (auto && av && !(auto in props)) {
    const explicit = av !== todayYmd();            // användaren har valt ett annat datum
    if (explicit || !(existing && existing[auto])) props[auto] = formatDate(auto, av);
  }
  return props;
}

/** Skriv till en lista objekt. Returnerar {ok, fail}. */
async function writeObjects(objs) {
  const libId = $("libId").value.trim(), defId = $("defId").value, tpl = $("linkTpl").value.trim();
  const live = $("live").checked;
  if (!S.fileIds.size) await loadFileIds();
  const index = await loadPsetIndex(false);       // behövs för att se vilka datum som redan finns
  let ok = 0, fail = 0;
  const queue = objs.slice();
  async function worker() {
    while (queue.length) {
      const o = queue.shift();
      const link = buildLink(tpl, o.forms, o.modelId);
      const props = propsFor(index.get(link));
      if (!Object.keys(props).length) continue;
      const path = `/psets/${encLink(link)}/${encodeURIComponent(libId)}/${encodeURIComponent(defId)}`;
      if (!live) { log(`(prov) PATCH ${psetBase()}${path}  ${short({ props }, 300)}`); ok++; continue; }
      try {
        await pset("PATCH", path, { props });
        index.set(link, { ...(index.get(link) || {}), ...props });   // håll lokala kopian i takt
        S.tlDirty = true;
        ok++;
      } catch (e) { fail++; log(`Fel för ${o.forms.guid}: ${e.message}`, "e"); }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return { ok, fail, live };
}

async function writeSelected() {
  if (!setupComplete()) { openSetup(true); log(t("needSetup"), "e"); return; }
  const objs = await selectedElements();
  if (!objs.length) return;
  log(`${$("live").checked ? "SPARAR" : "PROVKÖRNING"} på ${objs.length} element.`);
  const { ok, fail, live } = await writeObjects(objs);
  log(`Klart: ${ok} ok, ${fail} fel.`);
  if (!live) { openDebug(true); return; }
  refreshInfo();
  if (S.groups.size) await colorModel();   // visa resultatet direkt
}

// ---------- Penselläge ----------
async function toggleBrush() {
  if (S.brush.on) return stopBrush();
  if (!S.pick) return;
  if (!setupComplete()) { openSetup(true); log(t("needSetup"), "e"); return; }
  await loadPsetIndex(false);
  // Det som redan är markerat när penseln slås på räknas inte som "penseldrag"
  const sel = await S.api.viewer.getSelection();
  S.brush = { on: true, timer: null, sig: selSignature(sel), done: new Set(), count: 0, busy: false };
  S.brush.timer = setInterval(() => brushTick(), 700);   // fungerar även om viewern inte skickar markeringshändelser
  log(`Penselläge på: ${S.pick}`);
  renderWriteButton();
}
function stopBrush() {
  clearInterval(S.brush.timer);
  log(`Penselläge av: ${S.brush.count} element sparade.`);
  S.brush = { on: false, timer: null, sig: "", done: new Set(), count: 0, busy: false };
  renderWriteButton();
}
const selSignature = (sel) => (sel || []).map((m) => m.modelId + ":" + (m.objectRuntimeIds || []).join(",")).join("|");

async function brushTick(selFromEvent) {
  const B = S.brush;
  if (!B.on || B.busy) return;
  B.busy = true;
  try {
    const sel = selFromEvent || await S.api.viewer.getSelection();
    const sig = selSignature(sel);
    if (sig === B.sig) return;
    B.sig = sig;
    const picked = [];
    for (const m of sel || []) {
      const rids = (m.objectRuntimeIds || []).filter((r) => !B.done.has(K(m.modelId, r)));
      rids.forEach((r) => B.done.add(K(m.modelId, r)));
      if (rids.length) picked.push({ modelId: m.modelId, runtimeIds: rids });
    }
    if (!picked.length) return;
    const fresh = (await toElements(picked)).filter((o) => !B.done.has("el:" + K(o.modelId, o.runtimeId)));
    fresh.forEach((o) => B.done.add("el:" + K(o.modelId, o.runtimeId)));
    if (!fresh.length) return;
    // Färga direkt de delar som elementet bestämmer över
    const byModel = new Map();
    for (const o of fresh) for (const leaf of leavesOf(o.modelId, o.runtimeId)) {
      const info = S.leafInfo && S.leafInfo.get(K(o.modelId, leaf));
      if (!info || info.owner === o.runtimeId || info.owner === leaf) addTo(byModel, o.modelId, leaf);
    }
    const color = colorFor(S.pick);
    if (color && byModel.size) await S.api.viewer.setObjectState(selectorFor(byModel), { color, visible: true });
    const { ok } = await writeObjects(fresh);
    if (S.brush === B) { B.count += ok; renderWriteButton(); }
    moveInGroups(fresh, S.pick);
  } catch (e) { log(`Penselfel: ${e.message}`, "e"); }
  finally { B.busy = false; }
}
/** Uppdatera översiktens räknare lokalt efter penseldrag. */
function moveInGroups(objs, status) {
  if (!S.groups.size || !$("live").checked || !S.leafGroups) return;
  const remove = (groups, m, r) => { for (const byModel of groups.values()) { const ids = byModel.get(m); if (ids) { const i = ids.indexOf(r); if (i >= 0) ids.splice(i, 1); } } };
  for (const o of objs) {
    const m = o.modelId, el = o.runtimeId;
    remove(S.groups, m, el);
    if (!S.groups.has(status)) S.groups.set(status, new Map());
    addTo(S.groups.get(status), m, el);
    for (const leaf of leavesOf(m, el)) {
      const info = S.leafInfo.get(K(m, leaf));
      if (info && info.owner !== el && info.owner !== leaf) {
        if (info.owner !== topElement(m, leaf)) continue;   // delen har egen status på delnivå
      }
      remove(S.leafGroups, m, leaf);
      if (!S.leafGroups.has(status)) S.leafGroups.set(status, new Map());
      addTo(S.leafGroups.get(status), m, leaf);
      S.leafInfo.set(K(m, leaf), { owner: el, status });
    }
  }
  const prune = (g) => { for (const [k, byModel] of g) if (![...byModel.values()].some((ids) => ids.length)) g.delete(k); };
  prune(S.groups); prune(S.leafGroups);
  renderCards();
}

// ---------- 4D-tidslinje ----------
const TL_COLORS = { installed: "#3aa845", late: "#d64545", made: "#006393", sent: "#00c3dc", waiting: "#c3ccd3", ghost: "#eef1f3" };
const DAY = 864e5;

/** "2026-11-05", "2026-11-05T00:00:00Z" → UTC-midnatt (ms). */
function parseDay(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}
const mondayOf = (ms) => { const d = new Date(ms); return ms - ((d.getUTCDay() + 6) % 7) * DAY; };
function isoWeekYear(ms) { const d = new Date(mondayOf(ms) + 3 * DAY); return d.getUTCFullYear(); }
function mondayOfIsoWeek(year, week) {
  const jan4 = Date.UTC(year, 0, 4);
  return mondayOf(jan4) + (week - 1) * 7 * DAY;
}
const ymdOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const fmtDM = (ms) => { const d = new Date(ms); return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };

/** Läs in alla element med deras datum och bygg veckorna. */
async function buildTimeline() {
  if (!setupComplete()) { openSetup(true); throw new Error(t("needSetup")); }
  await loadFileIds(); upgradeTemplate();
  const tpl = $("linkTpl").value.trim(), F = S.fields;
  const index = await loadPsetIndex(true);
  const elements = [], untracked = new Map();
  const todayMs = parseDay(todayYmd());
  const models = ((await S.api.viewer.getObjects()) || []).map((m) => ({ modelId: m.modelId, rids: (m.objects || []).map((o) => o.id) }));
  const propsOf = new Map();
  for (const { modelId, rids } of models) {
    const ext = await toExternalIds(modelId, rids);
    for (const r of rids) { const p = ext.has(r) ? index.get(buildLink(tpl, idForms(ext.get(r)), modelId)) : null; if (p) propsOf.set(K(modelId, r), p); }
  }
  await loadStructure(models, new Set(propsOf.keys()));
  for (const { modelId, rids } of models) {
    // Element = översta objekt som inte är behållare; data från elementet, annars från någon av dess delar
    const tops = new Set();
    for (const r of rids) { if (S.containers.has(K(modelId, r))) continue; tops.add(topElement(modelId, r)); }
    for (const rid of tops) {
      let p = propsOf.get(K(modelId, rid));
      if (!p) for (const c of S.kids.get(K(modelId, rid)) || []) { p = propsOf.get(K(modelId, c)); if (p) break; }
      if (!p || !Object.values(p).some(Boolean)) { addTo(untracked, modelId, rid); continue; }
      const e = {
        modelId, rid,
        sent: parseDay(F.sent && p[F.sent]), made: parseDay(F.made && p[F.made]),
        installed: parseDay(F.installed && p[F.installed]), planned: parseDay(F.plannedDate && p[F.plannedDate]),
      };
      if (!e.planned && F.plannedWeek && p[F.plannedWeek]) {
        const ref = e.installed || e.made || e.sent || todayMs;
        e.planned = mondayOfIsoWeek(isoWeekYear(ref), Number(p[F.plannedWeek]));
      }
      if (!e.sent && !e.made && !e.installed && !e.planned) { addTo(untracked, modelId, rid); continue; }
      elements.push(e);
    }
  }
  const dates = elements.flatMap((e) => [e.sent, e.made, e.installed, e.planned]).filter(Boolean);
  if (!dates.length) return (S.tl = { elements, untracked, weeks: [], sel: -1 });

  let start = mondayOf(Math.min(...dates, todayMs)), end = mondayOf(Math.max(...dates, todayMs));
  const maxWeeks = 156;
  if ((end - start) / (7 * DAY) > maxWeeks) {           // väldigt långa projekt: håll kring idag
    start = Math.max(start, mondayOf(todayMs) - 78 * 7 * DAY);
    end = Math.min(end, start + maxWeeks * 7 * DAY);
  }
  const weeks = [];
  for (let mon = start; mon <= end; mon += 7 * DAY) weeks.push({ mon, end: mon + 7 * DAY - 1, planned: 0, installed: 0 });
  const wIdx = (ms) => Math.floor((mondayOf(ms) - start) / (7 * DAY));
  for (const e of elements) {
    if (e.planned) { const i = wIdx(e.planned); if (weeks[i]) weeks[i].planned++; }
    if (e.installed) { const i = wIdx(e.installed); if (weeks[i]) weeks[i].installed++; }
  }
  const now = Math.max(0, Math.min(weeks.length - 1, wIdx(todayMs)));
  S.tl = { elements, untracked, weeks, sel: now, now, painted: false };
  S.tlDirty = false;
  log(`Tidslinje: ${elements.length} element med PMJ-data, ${weeks.length} veckor.`);
  return S.tl;
}

/** Ett elements tillstånd i slutet av en vecka. */
function stateAt(e, endMs, mode) {
  const done = (d) => d && d <= endMs;
  if (mode === "chain") {
    if (done(e.installed)) return "installed";
    if (done(e.made)) return "made";
    if (done(e.sent)) return "sent";
    return "waiting";
  }
  if (done(e.installed)) return "installed";
  if (done(e.planned)) return "late";
  return "upcoming";
}

async function applyWeek(i) {
  const tl = S.tl;
  if (!tl || !tl.weeks.length) return;
  tl.sel = Math.max(0, Math.min(tl.weeks.length - 1, i));
  renderTimeline();
  if (tl.applying) { tl.pending = true; return; }    // uppspelning: hoppa till senaste begäran
  tl.applying = true;
  try {
    do {
      tl.pending = false;
      const wk = tl.weeks[tl.sel], mode = S.tlMode;
      if (!tl.painted) {
        await S.api.viewer.setObjectState(undefined, { color: "reset", visible: "reset" });
        if ([...tl.untracked.values()].some((ids) => ids.length)) await S.api.viewer.setObjectState(selectorFor(leavesMap(tl.untracked)), { color: TL_COLORS.ghost, visible: true });
        tl.painted = true;
      }
      const groups = new Map();
      for (const e of tl.elements) {
        const st = stateAt(e, wk.end, mode);
        if (!groups.has(st)) groups.set(st, new Map());
        const g = groups.get(st);
        if (!g.has(e.modelId)) g.set(e.modelId, []);
        g.get(e.modelId).push(e.rid);
      }
      tl.counts = Object.fromEntries([...groups].map(([k, g]) => [k, [...g.values()].reduce((a, ids) => a + ids.length, 0)]));
      for (const [st, g] of groups) {
        const sel = selectorFor(leavesMap(g));
        if (st === "upcoming") {
          await S.api.viewer.setObjectState(sel, $("showUpcoming").checked ? { color: TL_COLORS.waiting, visible: true } : { visible: false });
        } else {
          await S.api.viewer.setObjectState(sel, { color: TL_COLORS[st], visible: true });
        }
      }
      renderTlStats();
    } while (tl.pending);
  } finally { tl.applying = false; }
}

function renderTimeline() {
  const tl = S.tl, strip = $("strip");
  const has = tl && tl.weeks.length;
  $("tlBody").hidden = !has;
  $("tlEmpty").hidden = !!has;
  if (!has) { $("tlEmpty").textContent = tl ? t("emptyTl") : t("loadTl"); return; }
  const max = Math.max(1, ...tl.weeks.map((w) => Math.max(w.planned, w.installed)));
  if (strip.childElementCount !== tl.weeks.length) {
    strip.innerHTML = "";
    tl.weeks.forEach((w, i) => {
      const c = document.createElement("div");
      c.className = "wkc";
      c.title = `${t("wk")} ${isoWeek(ymdOf(w.mon))}: ${w.planned} ${t("lgPlanned")}, ${w.installed} ${t("lgInstalled")}`;
      c.innerHTML = `<div class="p"></div><div class="a"></div><span class="l"></span>`;
      c.querySelector(".p").style.height = `${(w.planned / max) * 100}%`;
      c.querySelector(".a").style.height = `${(w.installed / max) * 100}%`;
      c.onclick = () => { stopPlay(); guard(() => applyWeek(i))(); };
      strip.appendChild(c);
    });
  }
  [...strip.children].forEach((c, i) => {
    const wn = isoWeek(ymdOf(tl.weeks[i].mon));
    c.classList.toggle("sel", i === tl.sel);
    c.classList.toggle("now", i === tl.now);
    c.classList.toggle("past", i < tl.sel);
    c.querySelector(".l").textContent = (i === tl.sel || wn % 4 === 1) ? wn : "";
  });
  const sel = strip.children[tl.sel];
  if (sel) strip.scrollLeft = Math.max(0, sel.offsetLeft - strip.clientWidth / 2);
  const w = tl.weeks[tl.sel];
  $("wkTitle").textContent = `${t("wk")} ${isoWeek(ymdOf(w.mon))}`;
  $("wkDates").textContent = `${fmtDM(w.mon)}–${fmtDM(w.end)}${new Date(w.end).getUTCFullYear()}`;
  $("tlPlay").textContent = S.tlTimer ? t("pause") : t("play");
}

function renderTlStats() {
  const c = (S.tl && S.tl.counts) || {};
  const items = S.tlMode === "chain"
    ? [["sent", "stSent"], ["made", "stMade"], ["installed", "stInstalled"], ["waiting", "stWaiting"]]
    : [["installed", "stInstalled"], ["late", "stLate"], ["upcoming", "stUpcoming"]];
  const box = $("tlStats");
  box.innerHTML = "";
  for (const [k, lab] of items) {
    const d = document.createElement("div");
    d.className = "card";
    d.style.setProperty("--c", TL_COLORS[k] || TL_COLORS.waiting);
    d.innerHTML = `<div class="n"></div><div class="t"></div>`;
    d.querySelector(".n").textContent = c[k] || 0;
    d.querySelector(".t").textContent = t(lab);
    box.appendChild(d);
  }
}

function play() {
  const tl = S.tl;
  if (!tl || !tl.weeks.length) return;
  if (S.tlTimer) return stopPlay();
  if (tl.sel >= tl.weeks.length - 1) tl.sel = 0;        // börja om från början
  S.tlTimer = setInterval(() => {
    if (!S.tl || S.tl.sel >= S.tl.weeks.length - 1) return stopPlay();
    applyWeek(S.tl.sel + 1).catch((e) => { log(e.message, "e"); stopPlay(); });
  }, 800);
  applyWeek(tl.sel);
}
function stopPlay() { clearInterval(S.tlTimer); S.tlTimer = null; if (S.tl) renderTimeline(); }

async function open4d(force) {
  if (force || !S.tl || S.tlDirty) {
    stopPlay();
    await buildTimeline();
  }
  renderTimeline();
  if (S.tl && S.tl.weeks.length) { S.tl.painted = false; await applyWeek(S.tl.sel); }
}
function setMode(mode) {
  S.tlMode = mode;
  $("mSite").classList.toggle("on", mode === "site");
  $("mChain").classList.toggle("on", mode === "chain");
  $("showUpcoming").parentElement.hidden = mode === "chain";
  if (S.tl) applyWeek(S.tl.sel).catch((e) => log(e.message, "e"));
}

// ---------- Infokort: det markerade elementet ----------
const DEFAULT_MARK = "Tekla Assembly|Assembly/Cast unit Mark";
const MAX_CARDS = 5;
S.info = { seq: 0, sig: "", model: [] };   // model = egenskaper för senast visade objekt (för ⚙-listan)

/** Platta ut viewerns egenskaper till [{set, name, value}]. */
function flatProps(o) {
  const out = [];
  for (const ps of (o && o.properties) || []) {
    const set = ps.set || ps.name || "";
    for (const p of ps.properties || []) if (p && p.name != null) out.push({ set, name: String(p.name), value: p.value });
  }
  return out;
}
async function objectInfo(modelId, rid) {
  try { const r = await S.api.viewer.getObjectProperties(modelId, [rid]); return (r && r[0]) || null; } catch { return null; }
}
const propId = (p) => `${p.set}|${p.name}`;
function findProp(list, id) {
  const [set, name] = id.split("|");
  const lc = (x) => String(x || "").toLowerCase();
  return list.find((p) => lc(p.set) === lc(set) && lc(p.name) === lc(name)) || list.find((p) => lc(p.name) === lc(name));
}
function infoFields() {
  try { const v = JSON.parse(store.get("infoFields") || "null"); if (Array.isArray(v)) return v.slice(0, MAX_CARDS); } catch { /* ogiltigt */ }
  const F = S.fields || {};
  return [F.sent, F.made, F.plannedDate, F.installed].filter(Boolean).map((k) => "pmj:" + k).concat(["ifc:Tekla Assembly|Assembly/Cast unit weight"]).slice(0, MAX_CARDS);
}
const markId = () => store.get("infoMark") || DEFAULT_MARK;

/** PMJ-värden för ett element: elementets egna, annars från någon av dess delar. */
async function pmjValuesFor(o) {
  if (!S.def || !$("linkTpl").value.trim()) return {};
  if (!S.fileIds.size) { await loadFileIds(); upgradeTemplate(); }
  const index = await loadPsetIndex(false);
  const tpl = $("linkTpl").value.trim();
  const own = index.get(buildLink(tpl, o.forms, o.modelId));
  if (own) return own;
  const kids = (S.kids.get(K(o.modelId, o.runtimeId)) || []).slice(0, 200);
  if (!kids.length) return {};
  const ext = await toExternalIds(o.modelId, kids);
  for (const c of kids) { const p = ext.has(c) ? index.get(buildLink(tpl, idForms(ext.get(c)), o.modelId)) : null; if (p) return p; }
  return {};
}
const effStatus = (vals) => (vals && vals[$("statusKey").value]) || statusDefault() || null;

function fmtValue(kind, key, v) {
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) return { text: "–", cls: "blank" };
  if (kind === "pmj") {
    const p = S.props[key] || {};
    if (/date/i.test(`${p.format || ""} ${p.type || ""}`) || parseDay(v)) {
      const ms = parseDay(v);
      if (ms && key === (S.fields || {}).plannedDate) return { text: `${fmtDM(ms)}${new Date(ms).getUTCFullYear()} · ${t("wkShort")} ${isoWeek(ymdOf(ms))}`, cls: "" };
      if (ms) return { text: `✓ ${fmtDM(ms)}${new Date(ms).getUTCFullYear()}`, cls: "done" };
    }
    if (key === (S.fields || {}).plannedWeek) return { text: `${t("wkShort")} ${v}`, cls: "" };
    if (Array.isArray(v)) return { text: v.join(", "), cls: "" };
  }
  const n = typeof v === "number" ? Math.round(v * 1000) / 1000 : v;
  return { text: String(n), cls: "" };
}

/** Uppdatera kortet efter markeringen. Senaste anropet vinner. */
async function refreshInfo(sel) {
  const seq = ++S.info.seq;
  const box = $("info");
  try {
    if (!S.api) return;
    const list = (sel || (await S.api.viewer.getSelection()) || [])
      .map((m) => ({ modelId: m.modelId, runtimeIds: m.objectRuntimeIds || m.runtimeIds || [] })).filter((m) => m.runtimeIds.length);
    if (!list.length) { renderInfoEmpty(); return; }
    const els = await toElements(list);
    if (seq !== S.info.seq) return;
    if (!els.length) { renderInfoEmpty(); return; }
    if (els.length > 1) {
      const counts = new Map();
      for (const o of els.slice(0, 500)) { const st = effStatus(await pmjValuesFor(o)) || NONE; counts.set(st, (counts.get(st) || 0) + 1); }
      if (seq !== S.info.seq) return;
      renderInfoMulti(els.length, counts);
      return;
    }
    const o = els[0];
    const elInfo = await objectInfo(o.modelId, o.runtimeId);
    const leaf = leavesOf(o.modelId, o.runtimeId).find((r) => r !== o.runtimeId);
    const leafInfo = leaf != null ? await objectInfo(o.modelId, leaf) : null;
    const props = flatProps(elInfo);
    for (const p of flatProps(leafInfo)) if (!props.some((q) => propId(q) === propId(p))) props.push(p);
    const vals = await pmjValuesFor(o);
    if (seq !== S.info.seq) return;
    S.info.model = props;
    const product = (elInfo && elInfo.product && elInfo.product.name) || (leafInfo && leafInfo.product && leafInfo.product.name) || (elInfo && elInfo.class) || "";
    renderInfoOne(product, props, vals);
  } catch (e) {
    if (seq === S.info.seq) log(`Infokort: ${e.message}`, "e");
  } finally {
    if (seq === S.info.seq) box.hidden = false;
  }
}

function setStatusChip(st) {
  const chip = $("infoStatus"), box = $("info");
  const color = st ? colorFor(st) : null;
  chip.hidden = !st;
  if (st) { chip.textContent = statusName(st); chip.classList.toggle("light", /^#(a6|b8|c3|e)/i.test(color || "")); }
  box.style.setProperty("--ic", color || "var(--line)");
}
function renderInfoEmpty() {
  $("info").classList.add("blank");
  $("infoTitle").textContent = t("infoNone");
  $("infoMark").textContent = ""; $("infoMark").className = "imark";
  $("infoCards").innerHTML = "";
  setStatusChip(null);
  if (!$("infoCfg").hidden) renderInfoCfg();
}
function renderInfoMulti(n, counts) {
  $("info").classList.remove("blank");
  $("infoTitle").textContent = t("infoMulti", n);
  $("infoMark").textContent = ""; $("infoMark").className = "imark";
  setStatusChip(counts.size === 1 ? [...counts.keys()][0] : null);
  const wrap = document.createElement("div");
  wrap.className = "imulti";
  for (const st of sortByProcess([...counts.keys()])) {
    const s = document.createElement("span");
    s.style.setProperty("--c", colorFor(st) || "#d5dbe0");
    s.innerHTML = "<i></i>";
    s.append(`${counts.get(st)} ${statusName(st)}`);
    wrap.appendChild(s);
  }
  $("infoCards").innerHTML = ""; $("infoCards").appendChild(wrap);
}
function renderInfoOne(product, props, vals) {
  $("info").classList.remove("blank");
  $("infoTitle").textContent = product || "–";
  const mark = findProp(props, markId());
  const mk = $("infoMark");
  if (mark && mark.value != null && mark.value !== "") { mk.textContent = String(mark.value); mk.className = "imark"; }
  else { mk.textContent = t("noMark"); mk.className = "imark none"; }
  setStatusChip(effStatus(vals));
  const box = $("infoCards");
  box.innerHTML = "";
  for (const id of infoFields()) {
    let lab, f;
    if (id.startsWith("pmj:")) {
      const k = id.slice(4);
      if (!S.props[k]) continue;
      lab = fieldName(k); f = fmtValue("pmj", k, vals[k]);
    } else {
      const pid = id.slice(4), p = findProp(props, pid);
      lab = pid.split("|")[1] || pid; f = fmtValue("ifc", pid, p && p.value);
    }
    const c = document.createElement("div");
    c.className = "icard";
    c.innerHTML = `<div class="l"></div><div class="v"></div>`;
    c.querySelector(".l").textContent = lab; c.querySelector(".l").title = lab;
    const v = c.querySelector(".v"); v.textContent = f.text; v.title = f.text; if (f.cls) v.classList.add(f.cls);
    box.appendChild(c);
  }
  if (!$("infoCfg").hidden) renderInfoCfg();
}

/** ⚙: välj elementnummerfält och max 5 kort. */
function renderInfoCfg() {
  const model = S.info.model || [];
  // Elementnummer
  const selM = $("cfgMark"), cur = markId();
  selM.innerHTML = "";
  const ids = [...new Set([cur, DEFAULT_MARK, ...model.map(propId)])];
  for (const id of ids) {
    const p = findProp(model, id);
    const [set, name] = id.split("|");
    selM.add(new Option(`${set} › ${name}${p && p.value != null && p.value !== "" ? `  (${p.value})` : ""}`, id));
  }
  selM.value = cur;
  // Kort
  const chosen = infoFields();
  const box = $("cfgFields");
  box.innerHTML = "";
  const add = (group) => { const g = document.createElement("div"); g.className = "grp"; g.textContent = group; box.appendChild(g); };
  const opt = (id, text, preview) => {
    const l = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = chosen.includes(id);
    cb.disabled = !cb.checked && chosen.length >= MAX_CARDS;
    cb.onchange = () => {
      let next = infoFields().filter((x) => x !== id);
      if (cb.checked) next.push(id);
      store.set("infoFields", JSON.stringify(next.slice(0, MAX_CARDS)));
      renderInfoCfg(); refreshInfo();
    };
    l.append(cb, document.createTextNode(text));
    if (preview != null && preview !== "") { const sm = document.createElement("small"); sm.textContent = String(preview); l.appendChild(sm); }
    box.appendChild(l);
  };
  add("PMJ");
  for (const k of Object.keys(S.props)) if (k !== $("statusKey").value) opt("pmj:" + k, fieldName(k));
  add(t("modelGroup"));
  const modelIds = [...new Set([...chosen.filter((x) => x.startsWith("ifc:")).map((x) => x.slice(4)), ...model.map(propId)])];
  if (!modelIds.length) { const h = document.createElement("div"); h.className = "hint"; h.textContent = t("cfgPick"); box.appendChild(h); }
  for (const pid of modelIds) { const p = findProp(model, pid); const [set, name] = pid.split("|"); opt("ifc:" + pid, `${name}`, p ? p.value : set); }
}

/** Markeringen följs även om viewern inte skickar händelser. */
async function pollSelection() {
  if (!S.api || document.hidden) return;
  try {
    const sel = await S.api.viewer.getSelection();
    const sig = selSignature(sel);
    if (sig === S.info.sig) return;
    S.info.sig = sig;
    setSelCount((sel || []).reduce((a, m) => a + ((m.objectRuntimeIds || []).length), 0));
    refreshInfo(sel);
  } catch { /* tyst */ }
}

// ---------- Automatisk upptäckt ----------
const PER_PROJECT = new Set(["libId", "defId", "region"]);
const skey = (k) => (PER_PROJECT.has(k) && S.projectId ? `${S.projectId}.${k}` : k);

/** Connects projektregion → regionkod i API-adresserna. */
function regionFromProject(p) {
  const loc = String((p && (p.location || p.region || p.serverRegion)) || "").toLowerCase();
  if (!loc) return null;
  if (/eu|europe/.test(loc)) return "eu-west-1";
  if (/austral|ap-southeast-2/.test(loc)) return "ap-southeast-2";
  if (/asia|ap-southeast-1|singapore/.test(loc)) return "ap-southeast-1";
  if (/us|north|america/.test(loc)) return "us-east-1";
  return null;
}
const orgBase = () => psetBase().replace("://pset-api", "://org-api");

/** Kandidater för biblioteks-ID ur en Organizer-länk "frn:lib:<id>". */
function libIdCandidates(link) {
  const raw = String(link).replace(/^frn:lib:/, "");
  let dec = raw; try { dec = decodeURIComponent(raw); } catch { /* lämna */ }
  return [...new Set([dec, raw, dec.split(":")[0]])].filter(Boolean);
}

/** Hitta projektets PMJ-bibliotek utan att användaren behöver ange något ID. */
async function discoverLibrary() {
  if (!S.projectId) throw new Error("Projekt-ID saknas.");
  const forest = encodeURIComponent(`project:${S.projectId}:data`);
  const node = await pset("GET", `${orgBase()}/forests/${forest}/trees/ProjectContext/nodes/PSetLibs?deleted&fields=metadata`);
  const links = (node && node.links) || [];
  log(`Projektet har ${links.length} property set-bibliotek.`);
  const found = [];
  for (const link of links) {
    for (const id of libIdCandidates(link)) {
      let lib;
      try { lib = await pset("GET", `/libs/${encodeURIComponent(id)}`); } catch { continue; }
      if (!lib || lib.deleted) break;
      const defs = await psetAll(`/libs/${encodeURIComponent(id)}/defs`).catch(() => []);
      const statusDef = defs.find((d) => /rakennusosan\s*status/i.test(d.name || ""));
      found.push({ id, name: lib.name || id, modified: Date.parse(lib.modifiedAt || lib.updatedAt || lib.createdAt || 0) || 0, statusDef });
      break;
    }
  }
  const usable = found.filter((f) => f.statusDef)
    .sort((a, b) => (/pmj/i.test(b.name) - /pmj/i.test(a.name)) || (b.modified - a.modified));
  if (!usable.length) { log(`Hittade inget bibliotek med "Rakennusosan Status" (${found.map((f) => f.name).join(", ") || "inga"}).`, "e"); return false; }
  const pick = usable[0];
  log(`✔ Valde bibliotek "${pick.name}"${usable.length > 1 ? ` (av ${usable.length} med Rakennusosan Status, senast ändrade)` : ""}.`);
  $("libId").value = pick.id;
  store.set("defId", pick.statusDef.id || pick.statusDef.defId);
  return true;
}

/** Räkna ut länkmallen genom att matcha modellens GUID mot befintliga property set-länkar. */
async function autoLinkTemplate() {
  const index = await loadPsetIndex(true);
  if (!index.size) { log("Inga element har Rakennusosan Status ännu – länkformatet hittas automatiskt när första värdet finns, eller via ⚙.", "e"); return false; }
  const byGuid = new Map(), byUuid = new Map();
  for (const m of (await S.api.viewer.getObjects()) || []) {
    const rids = (m.objects || []).map((o) => o.id);
    const ext = await toExternalIds(m.modelId, rids);
    for (const e of ext.values()) { const f = idForms(e); byGuid.set(f.guid, m.modelId); byUuid.set(f.uuid.toLowerCase(), m.modelId); }
  }
  let n = 0;
  for (const link of index.keys()) {
    if (++n > 5000) break;
    for (const piece of link.split(/[:/|#?&=,;]+/)) {
      let tpl = null, modelId = null;
      if (byGuid.has(piece)) { tpl = link.replace(piece, "{guid}"); modelId = byGuid.get(piece); }
      else if (byUuid.has(piece.toLowerCase())) { tpl = link.replace(piece, "{uuid}"); modelId = byUuid.get(piece.toLowerCase()); }
      if (!tpl) continue;
      await loadFileIds();
      tpl = generalizeTemplate(tpl, modelId);
      $("linkTpl").value = tpl; store.set("linkTpl", tpl);
      log(`✔ Länkformat hittat automatiskt: ${tpl}`);
      return true;
    }
  }
  log("Hittade inga av de laddade modellernas element bland property set-länkarna. Är rätt modell öppen?", "e");
  return false;
}

/** Körs när token finns: hitta allt som går automatiskt, öppna ⚙ bara om något saknas. */
async function autoSetup() {
  try {
    if (!$("libId").value.trim()) await discoverLibrary();
  } catch (e) { log(`Automatisk sökning av bibliotek misslyckades: ${e.message}`, "e"); }
  if ($("libId").value.trim() && !S.def) await guard(loadLibrary)();
  if (S.def && !$("linkTpl").value.trim()) { try { await autoLinkTemplate(); } catch (e) { log(`Länkformat: ${e.message}`, "e"); } }
  if (!setupComplete()) openSetup(true);
}

// ---------- UI-skal ----------
function applyLang() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  $("btnLang").textContent = LANG === "sv" ? "FI" : "SV";
  $("btnSetup").title = t("settings");
  renderStatusGrid(); renderCards(); setDot();
  if (S.tl) { renderTimeline(); renderTlStats(); }
  if (S.api) refreshInfo(); else renderInfoEmpty();
}
function setDot() {
  const d = $("dot");
  if (S.connected && S.token) { d.className = "dot ok"; d.title = t("stOk"); }
  else if (S.connected) { d.className = "dot"; d.title = t("stWait"); }
  else { d.className = "dot bad"; d.title = t("stBad"); }
}
const openSetup = (on) => { $("setup").hidden = !on; };
const openDebug = (on) => { $("debug").hidden = !on; };
function showTab(which) {
  const tabs = { view: ["tabView", "paneView"], fill: ["tabFill", "paneFill"], d4: ["tab4d", "pane4d"] };
  for (const [k, [tab, pane]] of Object.entries(tabs)) { $(tab).classList.toggle("on", k === which); $(pane).hidden = k !== which; }
  if (which !== "d4") stopPlay();
  if (which === "fill" && S.api) guard(readSelection)();
  if (which === "d4" && S.api) guard(() => open4d(false))();
}

function onEvent(event, data) {
  if (event === "extension.accessToken") {
    if (data && data !== "pending" && data !== "denied") { const first = !S.token; S.token = data; if (first) afterToken(); }
    setDot(); return;
  }
  if (event === "viewer.onSelectionChanged") {
    setSelCount(Array.isArray(data) ? data.reduce((a, m) => a + ((m.objectRuntimeIds || []).length), 0) : 0);
    if (S.brush.on && Array.isArray(data)) brushTick(data);
    if (Array.isArray(data)) { S.info.sig = selSignature(data); refreshInfo(data); }
    return;
  }
  log(`händelse: ${event}`);
}
async function afterToken() { await autoSetup(); }
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
  { const v = store.get("linkTpl"); if (v) $("linkTpl").value = v; }
  $("btnLang").onclick = () => { LANG = LANG === "sv" ? "fi" : "sv"; store.set("lang", LANG); applyLang(); };
  $("btnSetup").onclick = () => openSetup($("setup").hidden);
  $("btnSetupDone").onclick = () => openSetup(false);
  $("btnDebug").onclick = () => openDebug($("debug").hidden);
  $("tabView").onclick = () => showTab("view");
  $("tabFill").onclick = () => showTab("fill");
  $("tab4d").onclick = () => showTab("d4");
  S.tlMode = "site";
  $("mSite").onclick = () => setMode("site");
  $("mChain").onclick = () => setMode("chain");
  $("tlPlay").onclick = play;
  $("tlPrev").onclick = () => { stopPlay(); if (S.tl) guard(() => applyWeek(S.tl.sel - 1))(); };
  $("tlNext").onclick = () => { stopPlay(); if (S.tl) guard(() => applyWeek(S.tl.sel + 1))(); };
  $("tlToday").onclick = () => { stopPlay(); if (S.tl) guard(() => applyWeek(S.tl.now))(); };
  $("tlReload").onclick = guard(() => open4d(true));
  $("showUpcoming").onchange = () => { if (S.tl) guard(() => applyWeek(S.tl.sel))(); };
  document.addEventListener("keydown", (ev) => {
    if ($("pane4d").hidden || !S.tl || /INPUT|SELECT/.test(ev.target.tagName)) return;
    if (ev.key === "ArrowLeft") { stopPlay(); applyWeek(S.tl.sel - 1); }
    if (ev.key === "ArrowRight") { stopPlay(); applyWeek(S.tl.sel + 1); }
  });
  $("btnLib").onclick = guard(loadLibrary);
  $("defId").onchange = guard(loadDefinition);
  $("statusKey").onchange = () => { store.set("statusKey", $("statusKey").value); S.pick = ""; if (S.brush.on) stopBrush(); renderStatusGrid(); };
  $("autoDate").value = todayYmd();
  $("autoDate").oninput = renderAutoHint;
  $("btnBrush").onclick = guard(toggleBrush);
  $("dateVal").oninput = () => { renderAutoHint(); renderWriteButton(); };
  $("live").onchange = () => { if (S.brush.on) stopBrush(); renderWriteButton(); };
  $("linkTpl").onchange = () => store.set("linkTpl", $("linkTpl").value.trim());
  $("region").onchange = () => store.set("region", $("region").value);
  $("btnDiscover").onclick = guard(discoverLink);
  $("btnProps").onclick = guard(showProps);
  $("btnColor").onclick = guard(colorModel);
  $("btnReset").onclick = guard(async () => {
    await S.api.viewer.setObjectState(undefined, { color: "reset", visible: "reset" });
    S.groups = new Map(); S.leafGroups = new Map(); S.hidden.clear(); renderCards();
  });
  $("btnWrite").onclick = guard(writeSelected);
  $("btnInfoCfg").onclick = () => { const h = !$("infoCfg").hidden; $("infoCfg").hidden = h; if (!h) renderInfoCfg(); };
  $("cfgMark").onchange = () => { store.set("infoMark", $("cfgMark").value); refreshInfo(); };
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
    try {
      const p = await S.api.project.getProject();
      S.projectId = p && p.id;
      log({ projekt: p });
      const region = regionFromProject(p);
      if (region) $("region").value = `https://pset-api.${region}.connect.trimble.com/v1`;
    } catch (e) { log(`Kunde inte läsa projektet: ${e.message}`, "e"); }
    { const v = store.get("region"); if (v && !S.projectId) $("region").value = v; }
    { const v = store.get("libId"); if (v) $("libId").value = v; }
    await requestToken();   // när token finns körs autoSetup()
    setInterval(pollSelection, 1200);
  } catch (e) {
    setDot();
    log(`Kunde inte ansluta till Connect: ${e.message}. Körs sidan inuti Connects 3D-visare?`, "e");
  }
}

init();
