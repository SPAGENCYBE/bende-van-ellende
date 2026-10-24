/**
 * Bende van ellende × Google Agenda
 * Plak dit in een nieuw Google Apps Script-project (script.google.com) met het Google-account
 * waarin jullie agenda's staan. Implementeer als web-app (uitvoeren als: ik, toegang: iedereen).
 * De web-app-link is je geheime koppel-link: plak die in de app bij De bende → Google Agenda.
 */
const DAGEN_TERUG = 7;      // hoeveel dagen terug ophalen
const DAGEN_VOORUIT = 120;  // hoeveel dagen vooruit ophalen

function doGet() {
  const tz = Session.getScriptTimeZone();
  const nu = new Date();
  const van = new Date(nu.getTime() - DAGEN_TERUG * 864e5);
  const tot = new Date(nu.getTime() + DAGEN_VOORUIT * 864e5);
  const uit = { ok: true, updated: new Date().toISOString(), calendars: [], events: [] };
  CalendarApp.getAllCalendars().filter(c => !c.isHidden()).forEach(c => {
    uit.calendars.push({ name: c.getName(), color: c.getColor(), writable: c.isOwnedByMe() });
    c.getEvents(van, tot).forEach(ev => {
      const heleDag = ev.isAllDayEvent(), s = ev.getStartTime(), e = ev.getEndTime();
      const einde = heleDag ? new Date(e.getTime() - 864e5) : e;
      uit.events.push({
        id: ev.getId() + "|" + s.getTime(),
        cal: c.getName(),
        title: ev.getTitle(),
        allDay: heleDag,
        date: Utilities.formatDate(s, tz, "yyyy-MM-dd"),
        time: heleDag ? "" : Utilities.formatDate(s, tz, "HH:mm"),
        endDate: Utilities.formatDate(einde, tz, "yyyy-MM-dd"),
        endTime: heleDag ? "" : Utilities.formatDate(e, tz, "HH:mm"),
        location: ev.getLocation() || "",
        note: (ev.getDescription() || "").slice(0, 500)
      });
    });
  });
  return json(uit);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action !== "create") return json({ ok: false, error: "Onbekende actie" });
    const cal = CalendarApp.getCalendarsByName(d.calendar)[0];
    if (!cal) return json({ ok: false, error: "Agenda niet gevonden: " + d.calendar });
    const [j, m, dag] = String(d.date).split("-").map(Number);
    let ev;
    if (!d.time) {
      ev = cal.createAllDayEvent(d.title, new Date(j, m - 1, dag), { description: d.note || "" });
    } else {
      const [u, min] = String(d.time).split(":").map(Number);
      const start = new Date(j, m - 1, dag, u, min);
      const einde = new Date(start.getTime() + (Number(d.duration) || 60) * 60000);
      ev = cal.createEvent(d.title, start, einde, { description: d.note || "", location: d.location || "" });
    }
    return json({ ok: true, id: ev.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Druk één keer op "Uitvoeren" met deze functie geselecteerd om toegang te geven en te testen.
function testen() {
  const data = JSON.parse(doGet().getContent());
  Logger.log("Gevonden agenda's: " + data.calendars.map(c => c.name).join(", "));
  Logger.log("Aantal afspraken: " + data.events.length);
}
