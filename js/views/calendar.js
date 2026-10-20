import { sb, showError } from "../core.js?v=20261020c";
import { mountCalendar } from "../calendar.js?v=20261020c";
export async function render(root) {
  const { data, error } = await sb.from("events").select("id,title,event_date,details").order("event_date");
  if (error) return showError(error);
  root.innerHTML = `<div class="card"><h2>📅 Calendario</h2><p class="muted">Toca un día marcado para ver lo que se planea.</p><div id="c"></div></div>`;
  mountCalendar(root.querySelector("#c"), data);
}
