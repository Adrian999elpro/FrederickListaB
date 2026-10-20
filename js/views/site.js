// Editor de diseño y contenido de la página pública: sello, colores, estilo, secciones, video y redes.
import { sb, esc, toast, showError, withBusy, mediaUrl, uploadMedia, $ } from "../core.js?v=20261020c";
import { loadSite, applyTheme, NETS, PRESETS, sealSrc } from "../site.js?v=20261020c";

export async function render(root) {
  const W = await loadSite(), O = structuredClone(W), files = {}, T = W.theme;
  const opts = (o, cur) => Object.entries(o).map(([k, v]) => `<option value="${k}"${k === cur ? " selected" : ""}>${esc(v)}</option>`).join("");
  const FONT = { moderna: "Moderna (sin serifas)", elegante: "Elegante (con serifas)", redondeada: "Redondeada y amable" };
  const RAD = { recto: "Esquinas rectas", suave: "Esquinas suaves", pildora: "Muy redondeadas" };
  const MOT = { completa: "Animaciones completas", suave: "Animaciones suaves", ninguna: "Sin animaciones" };
  const HERO = { centrada: "Portada centrada", dividida: "Portada alineada a la izquierda", banner: "Banner con imagen de fondo" };

  root.innerHTML = `<form id="f" class="form">
  <div class="card"><h2 style="margin:0">🎨 Diseño y contenido</h2><p class="muted" style="margin:.4rem 0 0">Lo que cambies aquí se aplica a la página pública. Colores y estilo se ven al instante; el resto, al guardar.</p></div>

  <div class="card form"><h3 style="margin:0">Sello e identidad</h3>
    <div class="row"><img id="seal-prev" src="${esc(sealSrc(W))}" alt="Sello actual" width="72" height="72" style="border-radius:50%;object-fit:cover">
      <label style="flex:1">Nombre del colegio<input name="school" maxlength="120" value="${esc(W.school)}"></label></div>
    <div class="row"><label style="flex:1">Cambiar el sello (PNG, JPG o WEBP, máx. 2 MB)<input type="file" name="seal" accept="image/png,image/jpeg,image/webp"></label>
      <label class="row"><input type="checkbox" name="show_seal"${W.show_seal ? " checked" : ""}> Mostrar el sello en cabecera y pie</label>
      <label class="row"><input type="checkbox" name="reset_seal"> Volver al sello original</label></div></div>

  <div class="card form"><h3 style="margin:0">Colores y estilo</h3>
    <div class="row">${Object.entries(PRESETS).map(([n, [p, a]]) => `<button type="button" class="btn ghost sm" data-preset="${p},${a}"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:.35rem;vertical-align:-2px;background:linear-gradient(90deg,${p} 50%,${a} 50%)"></span>${n}</button>`).join("")}</div>
    <div class="row"><label>Color principal<input type="color" name="primary" value="${esc(T.primary)}"></label><label>Color de acento<input type="color" name="accent" value="${esc(T.accent)}"></label>
      <label style="flex:1">Tipografía<select name="font">${opts(FONT, T.font)}</select></label><label style="flex:1">Esquinas<select name="radius">${opts(RAD, T.radius)}</select></label></div>
    <div class="row"><label style="flex:1">Animaciones<select name="motion">${opts(MOT, T.motion)}</select></label><label style="flex:1">Estilo de portada<select name="hero">${opts(HERO, T.hero)}</select></label></div>
    <div class="row"><label style="flex:1">Imagen de fondo de la portada (para el estilo Banner)<input type="file" name="hero_image" accept="image/png,image/jpeg,image/webp"></label>
      ${T.hero_image ? `<label class="row"><input type="checkbox" name="rm_hero"> Quitar la imagen actual</label>` : ""}</div></div>

  <div class="card"><h3 style="margin-top:0">Secciones bajo la portada <span class="muted">(orden, visibilidad y título)</span></h3><div id="secs"></div></div>

  <div class="card form"><h3 style="margin:0">Video</h3>
    <label>Enlace de YouTube, Vimeo o un archivo .mp4/.webm<input name="video_url" maxlength="300" value="${esc(W.video.url)}" placeholder="https://www.youtube.com/watch?v=…"></label>
    <div class="row"><label style="flex:1">…o sube un video (MP4 o WEBM, máx. 50 MB)<input type="file" name="video_file" accept="video/mp4,video/webm"></label>
      ${W.video.path ? `<label class="row"><input type="checkbox" name="rm_video"> Quitar el video subido</label>` : ""}</div>
    <p class="muted" style="margin:0">Si hay un video subido, ese se muestra en lugar del enlace.</p></div>

  <div class="card"><h3 style="margin-top:0">Redes sociales</h3><div id="nets"></div>
    <button type="button" class="btn ghost" id="add-net">＋ Agregar red</button>
    <p class="muted">Usa enlaces que empiecen con https:// · WhatsApp: el número con código de país · Correo: la dirección.</p></div>

  <div class="row end"><button class="btn primary">Guardar cambios</button></div></form>`;

  const f = $("#f", root);
  const drawSecs = () => ($("#secs", root).innerHTML = W.sections.map((s, i) => `<div class="row" data-i="${i}" style="padding:.4rem 0;border-bottom:1px solid var(--line-light)">
    <label class="row" title="Mostrar"><input type="checkbox" data-on${s.on ? " checked" : ""}> ${{ video: "Video", equipo: "Equipo", redes: "Redes" }[s.id]}</label>
    <input data-title value="${esc(s.title)}" maxlength="60" style="flex:1" aria-label="Título de la sección">
    <button type="button" class="btn ghost sm" data-mv="-1" ${i ? "" : "disabled"} aria-label="Subir">▲</button><button type="button" class="btn ghost sm" data-mv="1" ${i < W.sections.length - 1 ? "" : "disabled"} aria-label="Bajar">▼</button></div>`).join(""));
  const drawNets = () => ($("#nets", root).innerHTML = W.socials.map((n, i) => `<div class="row" data-i="${i}" style="padding:.3rem 0"><select data-net aria-label="Red">${opts(NETS, n.net)}</select>
    <input data-url value="${esc(n.url)}" maxlength="200" style="flex:1" placeholder="${n.net === "whatsapp" ? "+593 99 123 4567" : n.net === "correo" ? "consejo@colegio.edu.ec" : "https://…"}" aria-label="Enlace"><button type="button" class="btn danger sm" data-rm>Quitar</button></div>`).join("") || `<p class="muted">Aún no hay redes.</p>`);
  drawSecs(); drawNets();

  f.addEventListener("input", (e) => {
    const n = e.target.name;
    if (["primary", "accent", "font", "radius", "motion", "hero"].includes(n)) { T[n] = e.target.value; applyTheme(W); }
    if (n === "school") W.school = e.target.value; if (n === "show_seal") W.show_seal = e.target.checked; if (n === "video_url") W.video.url = e.target.value.trim();
    if (e.target.type === "file") { files[n] = e.target.files[0]; if (n === "seal" && files.seal) $("#seal-prev", root).src = URL.createObjectURL(files.seal); }
    const row = e.target.closest("[data-i]"); if (!row) return; const i = +row.dataset.i;
    if (e.target.matches("[data-on]")) W.sections[i].on = e.target.checked; if (e.target.matches("[data-title]")) W.sections[i].title = e.target.value;
    if (e.target.matches("[data-net]")) W.socials[i].net = e.target.value; if (e.target.matches("[data-url]")) W.socials[i].url = e.target.value;
  });
  f.addEventListener("click", (e) => {
    const pr = e.target.closest("[data-preset]"); if (pr) { [T.primary, T.accent] = pr.dataset.preset.split(","); f.primary.value = T.primary; f.accent.value = T.accent; applyTheme(W); }
    const mv = e.target.closest("[data-mv]"); if (mv) { const i = +mv.closest("[data-i]").dataset.i, j = i + +mv.dataset.mv; [W.sections[i], W.sections[j]] = [W.sections[j], W.sections[i]]; drawSecs(); }
    if (e.target.closest("#add-net")) { W.socials.push({ net: "instagram", url: "" }); drawNets(); }
    const rm = e.target.closest("[data-rm]"); if (rm) { W.socials.splice(+rm.closest("[data-i]").dataset.i, 1); drawNets(); }
  });
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    await withBusy(f.querySelector(".primary"), async () => { try {
      if (f.reset_seal.checked) W.seal = null; if (files.seal) W.seal = await uploadMedia(files.seal, "site");
      if (f.rm_hero?.checked) T.hero_image = null; if (files.hero_image) T.hero_image = await uploadMedia(files.hero_image, "site");
      if (f.rm_video?.checked) W.video.path = null; if (files.video_file) W.video.path = await uploadMedia(files.video_file, "site");
      W.socials = W.socials.filter((n) => n.url.trim());
      const { error } = await sb.from("site_settings").upsert({ key: "site", value: W, updated_at: new Date().toISOString() }); if (error) throw error;
      const gone = [[O.seal, W.seal], [O.theme.hero_image, T.hero_image], [O.video.path, W.video.path]].filter(([a, b]) => a && a !== b).map(([a]) => a);
      if (gone.length) sb.storage.from("council-media").remove(gone).catch(() => {});
      Object.assign(O, structuredClone(W)); toast("Cambios guardados. Ya se ven en la página pública."); render(root);
    } catch (err) { showError(err); } });
  });
}
