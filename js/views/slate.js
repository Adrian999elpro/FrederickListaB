// Editor de la lista pública: datos y logo, rangos (con orden) e integrantes (con foto y orden).
import { sb, esc, toast, showError, confirmBox, withBusy, mediaUrl, uploadMedia, $ } from "../core.js?v=20261020e";
let cur = null, ctx = {};
const drop = (p) => p && sb.storage.from("council-media").remove([p]).catch(() => {});

export async function render(root) {
  const [s, r, m] = await Promise.all([
    sb.from("slates").select("*").order("position").order("created_at"),
    sb.from("ranks").select("*").order("position"), sb.from("members").select("*").order("position")]);
  const err = s.error || r.error || m.error; if (err) return showError(err);
  const S = s.data.find((x) => x.id === cur) ?? s.data[0];
  if (!S) { ctx = { slates: s.data }; root.innerHTML = `<div class="card center"><p>Aún no hay ninguna lista.</p><button class="btn primary" data-act="newslate">Crear lista</button></div>`; return bind(); }
  cur = S.id; ctx = { S, ranks: r.data.filter((x) => x.slate_id === S.id), people: m.data.filter((x) => x.slate_id === S.id), slates: s.data };
  const ranks = r.data.filter((x) => x.slate_id === S.id), people = m.data.filter((x) => x.slate_id === S.id);
  const rankName = (id) => ranks.find((x) => x.id === id)?.name ?? "Sin rango";
  const groups = [...ranks.map((x) => ({ id: x.id, list: people.filter((p) => p.rank_id === x.id) })), { id: null, list: people.filter((p) => !ranks.some((x) => x.id === p.rank_id)) }];

  root.innerHTML = `
  <div class="card"><div class="row"><h2 style="margin:0;flex:1">🗳️ Lista e integrantes</h2>
    <select id="pick">${s.data.map((x) => `<option value="${x.id}"${x.id === S.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
    <button class="btn ghost sm" data-act="newslate">＋ Nueva lista</button><button class="btn danger sm" data-act="delslate">🗑 Borrar esta lista</button><a class="btn ghost sm" href="index.html" target="_blank" rel="noopener">Ver página pública</a></div></div>

  <form id="f-slate" class="card form" style="margin-top:1rem"><h3 style="margin:0">Datos de la lista</h3>
    <div class="row"><label style="flex:2">Nombre de la lista<input name="name" required minlength="2" maxlength="80" value="${esc(S.name)}"></label>
      <label style="flex:2">Lema<input name="motto" maxlength="160" value="${esc(S.motto)}" placeholder="Una frase corta"></label></div>
    <label>Plan de trabajo<textarea name="plan" rows="7" maxlength="4000">${esc(S.plan)}</textarea></label>
    <div class="row">${S.logo_path ? `<img src="${esc(mediaUrl(S.logo_path))}" alt="Logo actual" width="56" height="56" style="border-radius:50%;object-fit:cover">` : ""}
      <label style="flex:1">Logo (PNG, JPG o WEBP, máx. 2 MB)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label>
      ${S.logo_path ? `<label class="row"><input type="checkbox" name="rmlogo"> Quitar logo</label>` : ""}</div>
    <div class="row end"><button class="btn primary">Guardar lista</button></div></form>

  <div class="card" style="margin-top:1rem"><h3 style="margin-top:0">Rangos <span class="muted">(el de arriba es el más alto)</span></h3>
    ${ranks.map((x, i) => `<div class="row rank-row" data-id="${x.id}"><input data-rename value="${esc(x.name)}" maxlength="60" style="flex:1">
      <button class="btn ghost sm" data-act="up" data-t="ranks" ${i ? "" : "disabled"} aria-label="Subir">▲</button><button class="btn ghost sm" data-act="down" data-t="ranks" ${i < ranks.length - 1 ? "" : "disabled"} aria-label="Bajar">▼</button>
      <button class="btn danger sm" data-act="delrank">Borrar</button></div>`).join("") || `<p class="muted">Crea el primer rango (ej.: Presidente/a, Vicepresidente/a, Vocales).</p>`}
    <form id="f-rank" class="row" style="margin-top:.8rem"><input name="name" required minlength="2" maxlength="60" placeholder="Nuevo rango" style="flex:1"><button class="btn primary">Agregar rango</button></form></div>

  <div class="card" style="margin-top:1rem"><h3 style="margin-top:0">Integrantes</h3>
    <form id="f-member" class="form"><input type="hidden" name="id"><input type="hidden" name="old_photo">
      <div class="row"><label style="flex:2">Nombre y apellido<input name="full_name" required minlength="2" maxlength="120"></label>
        <label style="flex:1">Curso<input name="course" maxlength="60" placeholder="Ej.: 3ro Bachillerato B"></label>
        <label style="flex:1">Rango<select name="rank_id"><option value="">Sin rango</option>${ranks.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label></div>
      <div class="row"><label style="flex:2">Lema o frase (opcional)<input name="motto" maxlength="160"></label>
        <label style="flex:1">Foto<input name="photo" type="file" accept="image/png,image/jpeg,image/webp"></label></div>
      <div class="row end"><button type="button" class="btn ghost" data-act="clear">Limpiar</button><button class="btn primary">Guardar integrante</button></div></form>
    ${groups.filter((g) => g.list.length).map((g) => `<h4 class="rank-title in">${esc(rankName(g.id))}</h4>${g.list.map((p, i) => `<div class="row member-row" data-id="${p.id}">
      ${p.photo_path ? `<img src="${esc(mediaUrl(p.photo_path))}" alt="" width="40" height="40" style="border-radius:50%;object-fit:cover">` : `<span class="avatar mini">${esc(p.full_name[0] ?? "?")}</span>`}
      <div style="flex:1"><b>${esc(p.full_name)}</b><br><span class="muted">${esc(p.course)}</span></div>
      <button class="btn ghost sm" data-act="up" data-t="members" ${i ? "" : "disabled"} aria-label="Subir">▲</button><button class="btn ghost sm" data-act="down" data-t="members" ${i < g.list.length - 1 ? "" : "disabled"} aria-label="Bajar">▼</button>
      <button class="btn ghost sm" data-act="edit">Editar</button><button class="btn danger sm" data-act="del">Borrar</button></div>`).join("")}`).join("")}</div>`;
  bind();

  async function reorder(table, all, id, dir) {
    const me = all.find((x) => x.id === id), g = all.filter((x) => table === "ranks" || x.rank_id === me.rank_id);
    const i = g.findIndex((x) => x.id === id), j = i + dir; if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
    const ids = all.map((x) => x.id), slots = all.map((x, k) => (g.some((y) => y.id === x.id) ? k : -1)).filter((k) => k >= 0);
    slots.forEach((k, n) => (ids[k] = g[n].id));
    const { error } = await sb.rpc("reorder_items", { p_table: table, p_ids: ids }); error ? showError(error) : render(root);
  }
  function bind() {
    if (root._bound) return; root._bound = true;
    root.addEventListener("change", async (e) => {
      if (e.target.id === "pick") { cur = e.target.value; return render(root); }
      if (e.target.matches("[data-rename]")) { const { error } = await sb.from("ranks").update({ name: e.target.value.trim() }).eq("id", e.target.closest("[data-id]").dataset.id); error ? showError(error) : toast("Rango renombrado."); }
    });
    root.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, btn = f.querySelector(".primary"), kind = f.getAttribute("id"), { S, ranks, people } = ctx;
      await withBusy(btn, async () => { try {
        if (kind === "f-slate") {
          let logo = S.logo_path; if (f.rmlogo?.checked) logo = null;
          if (f.logo.files[0]) logo = await uploadMedia(f.logo.files[0], "logos");
          const { error } = await sb.from("slates").update({ name: f.name.value.trim(), motto: f.motto.value.trim(), plan: f.plan.value.trim(), logo_path: logo }).eq("id", S.id);
          if (error) throw error; if (logo !== S.logo_path) drop(S.logo_path);
        } else if (kind === "f-rank") {
          const { error } = await sb.from("ranks").insert({ slate_id: S.id, name: f.name.value.trim(), position: Math.max(0, ...ranks.map((x) => x.position)) + 1 }); if (error) throw error;
        } else if (kind === "f-member") {
          let photo = f.old_photo.value || null; if (f.photo.files[0]) photo = await uploadMedia(f.photo.files[0], "members");
          const v = { full_name: f.full_name.value.trim(), course: f.course.value.trim(), motto: f.motto.value.trim(), rank_id: f.rank_id.value || null, photo_path: photo };
          const { error } = f.id.value ? await sb.from("members").update(v).eq("id", f.id.value)
            : await sb.from("members").insert({ ...v, slate_id: S.id, position: Math.max(0, ...people.map((x) => x.position)) + 1 });
          if (error) throw error; if (f.id.value && photo !== f.old_photo.value) drop(f.old_photo.value);
        } else return;
        toast("Guardado."); render(root);
      } catch (err) { showError(err); } });
    });
    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return; const { S, ranks, people, slates } = ctx; const id = b.closest("[data-id]")?.dataset.id;
      if (b.dataset.act === "newslate") { const { data, error } = await sb.from("slates").insert({ name: "Nueva lista", position: slates.length + 1 }).select().single(); if (error) return showError(error); cur = data.id; return render(root); }
      if (b.dataset.act === "up" || b.dataset.act === "down") return reorder(b.dataset.t, b.dataset.t === "ranks" ? ranks : people, id, b.dataset.act === "up" ? -1 : 1);
      if (b.dataset.act === "delrank" && await confirmBox("¿Borrar este rango? Sus integrantes quedarán sin rango.", "Borrar")) { const { error } = await sb.from("ranks").delete().eq("id", id); return error ? showError(error) : render(root); }
      if (b.dataset.act === "delslate") {
        if (!await confirmBox(`¿Borrar la lista “${S.name}” con todos sus rangos e integrantes? No se puede deshacer.`, "Borrar lista")) return;
        const files = [S.logo_path, ...people.map((x) => x.photo_path)].filter(Boolean);
        const { error } = await sb.from("slates").delete().eq("id", S.id); if (error) return showError(error);
        if (files.length) sb.storage.from("council-media").remove(files).catch(() => {});
        cur = null; toast("Lista borrada."); return render(root);
      }
      const f = $("#f-member", root);
      if (b.dataset.act === "clear") { f.reset(); f.id.value = ""; f.old_photo.value = ""; }
      if (b.dataset.act === "edit") { const p = people.find((x) => x.id === id); f.id.value = p.id; f.old_photo.value = p.photo_path ?? ""; f.full_name.value = p.full_name; f.course.value = p.course; f.motto.value = p.motto; f.rank_id.value = p.rank_id ?? ""; f.scrollIntoView({ behavior: "smooth" }); f.full_name.focus(); }
      if (b.dataset.act === "del" && await confirmBox("¿Quitar a este integrante de la lista?", "Quitar")) { const p = people.find((x) => x.id === id); const { error } = await sb.from("members").delete().eq("id", id); if (error) return showError(error); drop(p.photo_path); render(root); }
    });
  }
}
