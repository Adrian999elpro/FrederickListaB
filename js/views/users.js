import { sb, can, esc, toast, showError, withBusy, $ } from "../core.js";
import { loadStudentOptions, studentFields, bindStudentFields, filterFields, readFilters } from "../student-options.js";
export async function render(root, access) {
  const manage = can(access, "users.manage");
  const [roles, catalog] = await Promise.all([sb.from("roles").select("id,name").order("name"), loadStudentOptions()]);
  if (roles.error) throw roles.error;
  root.innerHTML = `<div class="card"><h2>👥 Usuarios</h2>
    <p class="muted">Organiza a los estudiantes por curso, paralelo y especialidad. El rol decide qué apartados ve cada persona.</p>
    <label>Buscar estudiante<input id="q" type="search" placeholder="Nombre o correo" maxlength="120"></label>
    ${filterFields(catalog)}<p id="count" class="hint" role="status"></p><div id="rows" class="student-list"></div>
    <button id="more" type="button" class="btn ghost" hidden>Cargar más</button></div>
    ${manage ? `<details class="card catalog-manager"><summary>Cursos, paralelos y especialidades</summary>
      <p class="muted">Estas opciones aparecen al registrar y organizar estudiantes. Las especialidades solo aparecen en bachillerato.</p>
      <div class="catalog-grid">
        <form data-catalog="school_courses" class="form"><h3>Agregar curso</h3>
          <label>Nombre<input name="name" required maxlength="40" placeholder="Nombre del curso"></label>
          <label>Nivel<select name="level"><option value="basica">Básica</option><option value="bachillerato">Bachillerato</option></select></label>
          <button class="btn primary">Agregar curso</button><p class="hint">${catalog.courses.map((c) => esc(c.name)).join(" · ")}</p></form>
        <form data-catalog="school_parallels" class="form"><h3>Agregar paralelo</h3>
          <label>Nombre<input name="name" required maxlength="8" placeholder="Ej.: C"></label>
          <button class="btn primary">Agregar paralelo</button><p class="hint">${catalog.parallels.map((c) => esc(c.name)).join(" · ")}</p></form>
        <form data-catalog="school_specialties" class="form"><h3>Agregar especialidad</h3>
          <label>Nombre<input name="name" required maxlength="80" placeholder="Ej.: Informática"></label>
          <button class="btn primary">Agregar especialidad</button><p class="hint">${catalog.specialties.map((c) => esc(c.name)).join(" · ") || "Todavía no hay especialidades."}</p></form>
      </div></details>` : ""}`;
  let offset = 0, request = 0;
  function studentCard(p) {
    const mine = p.id === access.id, edit = manage || mine;
    const form = document.createElement("form"); form.className = "student-card form";
    form.innerHTML = `<div><h3>${esc(p.full_name || "Sin nombre")}</h3><p class="muted student-email">${esc(p.email)}</p></div>
      <fieldset ${edit ? "" : "disabled"}>
        <label>Nombre completo<textarea name="full_name" rows="2" required maxlength="120">${esc(p.full_name)}</textarea></label>
        ${!p.course_id && p.course ? `<p class="hint">Curso anterior: ${esc(p.course)}. Selecciona el curso y paralelo para organizarlo.</p>` : ""}
        ${studentFields(catalog, p)}
        <label>Rol<select name="role_id" ${manage && !mine ? "" : "disabled"}>${roles.data.map((r) => `<option value="${r.id}"${r.id === p.role_id ? " selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label>
      </fieldset>${edit ? '<button class="btn primary" type="submit">Guardar estudiante</button>' : ""}`;
    bindStudentFields(form, catalog);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await withBusy(form.querySelector('[type=submit]'), async () => {
        const v = new FormData(form);
        const { error } = await sb.rpc("set_student_profile", { p_id: p.id, p_full_name: v.get("full_name"), p_course_id: v.get("course_id"), p_parallel: v.get("parallel"), p_specialty_id: v.get("specialty_id") || null, p_role: manage && !mine ? v.get("role_id") : p.role_id });
        if (error) return showError(error);
        sessionStorage.removeItem("cs_access"); toast("Estudiante actualizado."); await load();
      });
    });
    return form;
  }
  async function load(append = false) {
    const mine = ++request; if (!append) offset = 0;
    let query = sb.from("profiles").select("id,email,full_name,course,course_id,parallel,specialty_id,role_id,status", { count: "exact" });
    const q = $("#q", root).value.trim().replace(/[(),%_*\\"]/g, " ").trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    for (const [key, value] of Object.entries(readFilters(root))) if (value) query = query.eq(key, value);
    const { data, error, count } = await query.order("full_name").order("id").range(offset, offset + 49);
    if (mine !== request) return; if (error) return showError(error);
    const list = $("#rows", root); if (!append) list.replaceChildren();
    data.forEach((p) => list.append(studentCard(p))); offset += data.length;
    $("#count", root).textContent = `${count} estudiante${count === 1 ? "" : "s"} · ${offset} visible${offset === 1 ? "" : "s"}`;
    if (!offset) list.innerHTML = '<p class="muted">No hay estudiantes con estos filtros.</p>';
    $("#more", root).hidden = offset >= count;
  }
  let timer;
  $("#q", root).addEventListener("input", () => { clearTimeout(timer); request++; timer = setTimeout(() => load(), 250); });
  root.querySelectorAll('[data-filter]').forEach((el) => el.addEventListener("change", () => load()));
  $("#more", root).addEventListener("click", (e) => withBusy(e.currentTarget, () => load(true)));
  root.querySelectorAll('[data-catalog]').forEach((form) => form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await withBusy(form.querySelector("button"), async () => {
      const table = form.dataset.catalog, name = form.elements.name.value.trim();
      if (!name) return toast("Escribe un nombre.", "err");
      const value = table === "school_courses" ? { name, level: form.elements.level.value, position: Math.max(0, ...catalog.courses.map((c) => c.position)) + 1 } : table === "school_parallels" ? { id: name.toUpperCase(), name: name.toUpperCase() } : { name };
      const { error } = await sb.from(table).insert(value);
      if (error) return error.code === "23505" ? toast("Esa opción ya existe.", "err") : showError(error);
      toast("Opción agregada."); await render(root, access);
    });
  }));
  await load();
}
