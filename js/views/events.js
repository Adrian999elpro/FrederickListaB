import { sb, esc, toast, showError, confirmBox, withBusy, $ } from "../core.js";
import { mountCalendar } from "../calendar.js";
export async function render(root) {
  root.innerHTML = `<div class="card"><h2>🗓️ Gestionar eventos</h2>
    <form id="f" class="form"><input type="hidden" name="id">
      <div class="row"><label style="flex:2">Título<input name="title" required minlength="2" maxlength="80" placeholder="Ej.: Navidad"></label>
        <label>Fecha<input name="event_date" type="date" required></label></div>
      <label>¿Qué se planea ese día? (lo verán todos)<textarea name="details" rows="4" maxlength="2000" placeholder="Actividades, hora, lugar…"></textarea></label>
      <div class="row end"><button type="button" class="btn ghost" id="clr">Limpiar</button><button class="btn primary">Guardar evento</button></div></form></div>
    <div class="card" style="margin-top:1rem"><div id="cal"></div></div>
    <div class="card" style="margin-top:1rem"><h3>Todos los eventos</h3><div id="list"></div></div>`;
  const f = $("#f", root); let rows = [], cal;
  async function load() {
    const { data, error } = await sb.from("events").select("id,title,event_date,details").order("event_date");
    if (error) return showError(error); rows = data;
    cal ? cal.refresh(rows) : (cal = mountCalendar($("#cal", root), rows, { onPick: (d) => { f.event_date.value = d; f.title.focus(); } }));
    $("#list", root).innerHTML = rows.length ? `<table class="table"><tbody>${rows.map((e) => `<tr><td><b>${esc(e.title)}</b><br><span class="muted">${e.event_date}</span></td>
      <td class="actions"><button class="btn ghost sm" data-edit="${e.id}">Editar</button> <button class="btn danger sm" data-del="${e.id}">Borrar</button></td></tr>`).join("")}</tbody></table>` : `<p class="muted">Aún no hay eventos.</p>`;
  }
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    await withBusy(f.querySelector(".primary"), async () => {
      const v = { title: f.title.value.trim(), event_date: f.event_date.value, details: f.details.value.trim() };
      const { error } = f.id.value ? await sb.from("events").update(v).eq("id", f.id.value) : await sb.from("events").insert(v);
      if (error) return showError(error); toast("Evento guardado."); f.reset(); f.id.value = ""; load();
    });
  });
  $("#clr", root).addEventListener("click", () => { f.reset(); f.id.value = ""; });
  root.addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
    if (ed) { const x = rows.find((r) => r.id === ed.dataset.edit); f.id.value = x.id; f.title.value = x.title; f.event_date.value = x.event_date; f.details.value = x.details; f.scrollIntoView({ behavior: "smooth" }); }
    if (del && await confirmBox("¿Borrar este evento del calendario?", "Borrar")) { const { error } = await sb.from("events").delete().eq("id", del.dataset.del); error ? showError(error) : (toast("Evento borrado."), load()); }
  });
  load();
}
