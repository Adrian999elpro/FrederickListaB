// Calendario mensual compartido (página pública, panel y gestión). Los eventos se leen con RLS: son públicos.
import { esc } from "./core.js?v=20261020e";
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function mountCalendar(root, events, { onPick } = {}) {
  const byDay = {}; events.forEach((e) => (byDay[e.event_date] ??= []).push(e));
  const now = new Date(); let y = now.getFullYear(), m = now.getMonth();
  function draw() {
    const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), today = iso(now.getFullYear(), now.getMonth(), now.getDate());
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<div class="cal-day out"></div>`;
    for (let d = 1; d <= days; d++) {
      const k = iso(y, m, d), list = byDay[k] ?? [];
      cells += `<button type="button" class="cal-day${list.length ? " has" : ""}${k === today ? " today" : ""}" data-d="${k}" ${list.length || onPick ? "" : "tabindex='-1'"}>
        <span>${d}</span>${list.slice(0, 2).map((e) => `<span class="cal-chip">${esc(e.title)}</span>`).join("")}${list.length > 2 ? `<span class="muted">+${list.length - 2}</span>` : ""}</button>`;
    }
    root.innerHTML = `<div class="cal-head"><button type="button" class="btn ghost sm" data-nav="-1" aria-label="Mes anterior">‹</button><h3>${MESES[m]} ${y}</h3><button type="button" class="btn ghost sm" data-nav="1" aria-label="Mes siguiente">›</button></div>
      <div class="cal-grid">${["L","M","X","J","V","S","D"].map((x) => `<div class="cal-dow">${x}</div>`).join("")}${cells}</div>`;
  }
  root.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]"); if (nav) { m += +nav.dataset.nav; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return draw(); }
    const day = e.target.closest(".cal-day[data-d]"); if (!day) return;
    const list = byDay[day.dataset.d] ?? [];
    if (onPick) return onPick(day.dataset.d, list);
    if (list.length) showDay(day.dataset.d, list);
  });
  draw();
  return { refresh(next) { for (const k in byDay) delete byDay[k]; next.forEach((ev) => (byDay[ev.event_date] ??= []).push(ev)); draw(); } };
}

export function showDay(date, list) {
  const [yy, mm, dd] = date.split("-").map(Number);
  const d = document.createElement("dialog"); d.className = "dlg";
  d.innerHTML = `<form method="dialog" class="form"><h2 style="margin:0">${dd} de ${MESES[mm - 1]} de ${yy}</h2>
    ${list.map((e) => `<div class="day-item"><h3>${esc(e.title)}</h3><p>${esc(e.details) || "<span class='muted'>Sin más detalles todavía.</span>"}</p></div>`).join("")}
    <div class="row end"><button class="btn primary">Cerrar</button></div></form>`;
  d.addEventListener("close", () => d.remove()); document.body.append(d); d.showModal();
}
