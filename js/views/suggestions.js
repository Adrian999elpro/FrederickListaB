import { sb, can, esc, fmtDate, toast, showError, withBusy, $ } from "../core.js";
export async function render(root, access) {
  const all = can(access, "suggestions.read");
  root.innerHTML = `<div class="card"><h2>💡 Sugerencias y necesidades</h2><p class="muted">Cuéntanos una idea o qué necesita el colegio. Tu nombre y curso se envían con el mensaje.</p>
    <form id="f" class="form"><label>Tipo<select name="kind"><option value="sugerencia">Sugerencia (una idea)</option><option value="necesidad">Necesidad (algo que le falta al colegio)</option></select></label>
      <label>Mensaje<textarea name="body" rows="4" required minlength="5" maxlength="1000" placeholder="Escribe aquí…"></textarea></label>
      <div class="row end"><button class="btn primary">Enviar</button></div></form></div>
    <div class="card" style="margin-top:1rem"><h3>${all ? "Todas las sugerencias y necesidades" : "Mis envíos"}</h3><div id="list"></div></div>`;
  async function load() {
    const { data, error } = await sb.from("suggestions").select("id,author_name,kind,body,created_at").order("created_at", { ascending: false }).limit(200);
    if (error) return showError(error);
    $("#list", root).innerHTML = data.length ? data.map((s) => `<article class="day-item"><div class="row"><span class="badge ${s.kind === "necesidad" ? "warn" : "blue"}">${s.kind}</span>
      ${all ? `<b>${esc(s.author_name)}</b>` : ""}<span class="muted">${fmtDate(s.created_at)}</span></div><p style="white-space:pre-line">${esc(s.body)}</p></article>`).join("") : `<p class="muted">Todavía no hay mensajes.</p>`;
  }
  const f = $("#f", root);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    await withBusy(f.querySelector(".primary"), async () => {
      const { error } = await sb.from("suggestions").insert({ kind: f.kind.value, body: f.body.value.trim() });
      if (error) return showError(error); f.body.value = ""; toast("¡Gracias! Tu mensaje fue enviado."); load();
    });
  });
  load();
}
