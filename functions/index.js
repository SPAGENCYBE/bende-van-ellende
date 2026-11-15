// Bende van ellende: pushmeldingen
// - nieuwBericht: melding naar de rest van de bende bij een nieuw bericht in Babbels
// - agendaHerinnering: elke 10 minuten, melding een uur voor afspraken (app én Google Agenda)
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 2 });
const db = admin.firestore();

const APP = "https://spagencybe.github.io/bende-van-ellende/";
const TZ = "Europe/Brussels";

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const fmtDate = ms => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(ms));
function tzOffset(ms) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  const g = t => +p.find(x => x.type === t).value;
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ms;
}
function localToUtc(date, time) {
  const [y, mo, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return guess - tzOffset(guess);
}

async function tokens(filter) {
  const snap = await db.collection("pushTokens").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(filter);
}

async function send(list, title, body, hash, tag, type) {
  if (!list.length) return { tokens: 0, ok: 0, errors: [] };
  const res = await admin.messaging().sendEach(list.map(t => ({
    token: t.id,
    notification: { title, body },
    data: { type: type || "" },
    webpush: {
      notification: { icon: APP + "icons/icon-192.png", badge: APP + "icons/icon-192.png", tag, renotify: true },
      fcmOptions: { link: APP + (hash ? "#" + hash : "") }
    }
  })));
  const dood = [], errors = [];
  res.responses.forEach((r, i) => {
    const c = r.error && r.error.code;
    if (!r.success) { errors.push(`${list[i].who || "?"}: ${c || "onbekend"}`); console.warn("push mislukt", list[i].who, c, r.error && r.error.message); }
    // Alleen echt verlopen toestellen opruimen.
    if (!r.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(c)) dood.push(list[i].id);
  });
  await Promise.all(dood.map(id => db.collection("pushTokens").doc(id).delete()));
  return { tokens: list.length, ok: res.successCount, errors: errors.slice(0, 10) };
}

// Laatste verzending bijhouden, zodat de app kan tonen of meldingen vertrekken.
async function logStatus(kind, extra) {
  try { await db.collection("meta").doc("pushStatus").set({ at: Date.now(), kind, ...extra }); } catch (e) { console.warn("pushStatus", e); }
}

exports.nieuwBericht = onDocumentCreated("messages/{id}", async event => {
  const m = event.data && event.data.data();
  if (!m) return;
  const tekst = String(m.text || m.pm || "");
  const body = (m.photo ? "📷 " : "") + (tekst || (m.photo ? "Foto" : ""));
  if (!body) return;
  // Privégesprek ("dm:<id>_<id>"): alleen de ontvanger krijgt een melding.
  const prive = typeof m.chat === "string" && m.chat.startsWith("dm:");
  const ontvangers = prive ? m.chat.slice(3).split("_").filter(id => id !== m.from) : null;
  const van = m.from ? (await db.collection("members").doc(m.from).get()).data() : null;
  const lijst = await tokens(t => t.msgs !== false && t.who !== m.from && (!prive || ontvangers.includes(t.who)));
  const alle = (await db.collection("pushTokens").get()).size;
  const res = await send(lijst, `💬 ${van ? van.name : "De bende"}${prive ? " (privé)" : ""}`, body.slice(0, 180), "babbel", prive ? "dm-" + m.chat : "babbel", "chat");
  await logStatus("bericht", { van: m.from || "", prive, alleToestellen: alle, ...res });
});

exports.agendaHerinnering = onSchedule({ schedule: "every 10 minutes", timeZone: TZ }, async () => {
  const nu = Date.now(), van = nu + 50 * 60e3, tot = nu + 60 * 60e3;
  const vandaag = fmtDate(nu), morgen = fmtDate(nu + 864e5);
  const leden = (await db.collection("members").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  const items = [];

  (await db.collection("events").where("date", "in", [vandaag, morgen]).get()).docs.forEach(d => {
    const e = d.data();
    if (e.time) items.push({ key: `a-${d.id}-${e.date}-${e.time}`, title: e.title, date: e.date, time: e.time, who: e.who || [], location: "" });
  });

  const g = (await db.collection("meta").doc("google").get()).data();
  if (g && g.url) {
    try {
      const d = await (await fetch(g.url, { redirect: "follow" })).json();
      (d.events || []).forEach(e => {
        if (!e.time || /menu/i.test(e.cal) || (e.date !== vandaag && e.date !== morgen)) return;
        const lid = leden.find(x => norm(x.name) === norm(e.cal));
        items.push({ key: `g-${e.id}`, title: e.title, date: e.date, time: e.time, who: lid ? [lid.id] : [], location: e.location || "" });
      });
    } catch (err) { console.warn("Google Agenda ophalen mislukt", err); }
  }

  const toks = await tokens(t => t.agenda !== false);
  for (const it of items) {
    const at = localToUtc(it.date, it.time);
    if (at <= van || at > tot) continue;
    const id = it.key.replace(/[\/\s]/g, "_").slice(0, 400);
    const ref = db.collection("pushLog").doc(id);
    if ((await ref.get()).exists) continue;
    await ref.set({ at: nu });
    const lijst = toks.filter(t => !it.who.length || t.who === "all" || it.who.includes(t.who));
    const namen = it.who.map(i => (leden.find(m => m.id === i) || {}).name).filter(Boolean).join(", ");
    await send(lijst, `⏰ Om ${it.time}: ${it.title}`, [namen, it.location].filter(Boolean).join(" · ") || "Over een uur", "agenda", "agenda-" + id, "agenda");
  }

  // oude logregels opruimen
  const oud = await db.collection("pushLog").where("at", "<", nu - 3 * 864e5).limit(200).get();
  await Promise.all(oud.docs.map(d => d.ref.delete()));
});

// Testmelding vanuit de app (De bende → Deze tablet → Testmelding): stuurt naar dat ene toestel.
exports.testMelding = onDocumentCreated("pushTest/{id}", async event => {
  const d = event.data && event.data.data();
  if (!d || !d.token) return;
  const tok = await db.collection("pushTokens").doc(d.token).get();
  if (!tok.exists) { await event.data.ref.set({ done: true, ok: 0, error: "toestel-niet-ingeschreven" }, { merge: true }); return; }
  const res = await send([{ id: d.token, ...tok.data() }], "✅ Testmelding", "Meldingen werken op dit toestel.", "bende", "test-" + Date.now(), "test");
  await event.data.ref.set({ done: true, ok: res.ok, error: res.errors[0] || "" }, { merge: true });
});

// ---------- School & winkel: meldingen naar ouders en kinderen ----------
async function leden() { return (await db.collection("members").get()).docs.map(d => ({ id: d.id, ...d.data() })); }
async function naarOuders(title, body, hash, tag) {
  const L = await leden(), ouders = L.filter(m => m.role === "ouder").map(m => m.id);
  const lijst = await tokens(t => t.school !== false && ouders.includes(t.who));
  const res = await send(lijst, title, body, hash, tag, "school");
  await logStatus("school", { tokens: res.tokens, ok: res.ok, errors: res.errors, alleToestellen: lijst.length });
}
async function naarLid(id, title, body, hash, tag) {
  const lijst = await tokens(t => t.school !== false && t.who === id);
  await send(lijst, title, body, hash, tag, "school");
}

// Grote test gemaakt → ouders
exports.testGemaakt = onDocumentCreated("oefenlog/{id}", async event => {
  const x = event.data && event.data.data();
  if (!x || x.kind !== "test") return;
  const kind = (await db.collection("members").doc(x.who).get()).data();
  await naarOuders(`🏆 ${kind ? kind.name : "Een kind"} maakte de grote test`, `${x.titel || "Oefening"}: ${x.score}/${x.max || 10} in één keer juist`, "school", "test-" + x.who);
});

// Schooltaak afgevinkt door een kind → ouders
exports.schooltaakKlaar = onDocumentUpdated("school/{id}", async event => {
  const voor = event.data.before.data(), na = event.data.after.data();
  if (!na || voor.done || !na.done || !na.who) return;
  const kind = (await db.collection("members").doc(na.who).get()).data();
  if (!kind || kind.role !== "kind") return;
  await naarOuders(`✅ ${kind.name} is klaar`, `${na.kind ? na.kind + ": " : ""}${na.title}`, "school", "school-" + event.params.id);
});

// Beloning gevraagd → ouders
exports.beloningGevraagd = onDocumentCreated("redeems/{id}", async event => {
  const x = event.data && event.data.data();
  if (!x || x.status !== "wacht") return;
  const kind = (await db.collection("members").doc(x.who).get()).data();
  await naarOuders(`🎁 ${kind ? kind.name : "Iemand"} wil iets inwisselen`, `${x.emoji || ""} ${x.title} · ⭐ ${x.cost}`, "bende", "redeem-" + event.params.id);
});

// Beloning goedgekeurd of afgewezen → kind
exports.beloningBeslist = onDocumentUpdated("redeems/{id}", async event => {
  const voor = event.data.before.data(), na = event.data.after.data();
  if (!na || voor.status === na.status || na.status === "wacht") return;
  await naarLid(na.who, na.status === "goed" ? "🎉 Goedgekeurd!" : "Helaas, afgewezen", na.status === "goed" ? `${na.emoji || ""} ${na.title}` : `${na.title}. Je krijgt je ⭐ ${na.cost} terug.`, "bende", "redeem-" + event.params.id);
});
