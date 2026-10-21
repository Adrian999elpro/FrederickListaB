import { sb, can, esc, fmtDate, toast, showError, withBusy, $ } from "../core.js?v=20261020e";
import { loadStudentOptions, filterFields, readFilters } from "../student-options.js?v=20261020e";
export async function render(root, access) {
  const all = can(access, "suggestions.read"), catalog = await loadStudentOptions();
  root.innerHTML = `<div class="card"><h2>💡 Sugerencias y necesidades</h2><p class="muted">Cuéntanos una idea o qué necesita el colegio. Tu nombre y curso se envían con el mensaje.</p>
    <form id="f" class="form"><label>Tipo<select name="kind"><option value="sugerencia">Sugerencia (una idea)</option><option value="necesidad">Necesidad (algo que le falta al colegio)</option></select></label>
      <label>Mensaje<textarea name="body" rows="4" required minlength="5" maxlength="1000" placeholder="Escribe aquí…"></textarea></label>
      <div class="row end"><button class="btn primary">Enviar</button></div></form></div>
    <div class="card" style="margin-top:1rem"><h3>${all ? "Todas las sugerencias y necesidades" : "Mis envíos"}</h3>
      ${all ? filterFields(catalog) : ""}<p id="count" class="hint" role="status"></p>
      <div id="list"></div><button id="more" class="btn ghost" type="button" hidden>Cargar más</button></div>`;
  let request = 0, offset = 0;
  async function load(append = false) {
    const mine = ++request; if (!append) offset = 0;
    let query = sb.from("suggestions").select("id,author_name,kind,body,created_at,specialty_id", { count: "exact" });
    for (const [key, value] of Object.entries(readFilters(root))) if (value) query = query.eq(key, value);
    const { data, error, count } = await query.order("created_at", { ascending: false }).order("id").range(offset, offset + 49);
    if (mine !== request) return; if (error) return showError(error);
    const html = data.map((s) => `<article class="day-item"><div class="row"><span class="badge ${s.kind === "necesidad" ? "warn" : "blue"}">${esc(s.kind)}</span>
      ${all ? `<b>${esc(s.author_name)}</b>` : ""}<span class="muted">${fmtDate(s.created_at)}</span></div>
      ${s.specialty_id ? `<span class="hint">${esc(catalog.specialties.find((x) => x.id === s.specialty_id)?.name || "")}</span>` : ""}
      <p style="white-space:pre-line">${esc(s.body)}</p></article>`).join("");
    if (append) $("#list", root).insertAdjacentHTML("beforeend", html);
    else $("#list", root).innerHTML = html || '<p class="muted">No hay mensajes con estos filtros.</p>';
    offset += data.length; $("#count", root).textContent = `${count} mensaje${count === 1 ? "" : "s"}`;
    $("#more", root).hidden = offset >= count;
  }
  root.querySelectorAll('[data-filter]').forEach((el) => el.addEventListener("change", () => load()));
  $("#more", root).addEventListener("click", (e) => withBusy(e.currentTarget, () => load(true)));
  const f = $("#f", root);
  f.addEventListener("submit", async (e) => {
    e.preventDefault(); const body = f.body.value.trim();
    if (body.length < 5) return toast("Escribe al menos 5 caracteres.", "err");
    await withBusy(f.querySelector(".primary"), async () => {
      const { error } = await sb.from("suggestions").insert({ kind: f.kind.value, body });
      if (error) return showError(error);
      f.body.value = ""; toast("¡Gracias! Tu mensaje fue enviado."); await load();
    });
  });
  await load();
}
