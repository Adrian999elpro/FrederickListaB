import { sb, can, esc, toast, showError, withBusy, $, $$ } from "../core.js";
export async function render(root, access) {
  const manage = can(access, "users.manage");
  const [u, r] = await Promise.all([
    sb.from("profiles").select("id,email,full_name,course,role_id,status").order("full_name"),
    sb.from("roles").select("id,name").order("name")]);
  if (u.error || r.error) return showError(u.error || r.error);
  root.innerHTML = `<div class="card"><h2>👥 Usuarios</h2><p class="muted">Cambia el nombre, el curso y el rol (el rol decide qué apartados ve cada persona).</p>
    <input id="q" type="search" placeholder="Buscar por nombre o correo…" style="margin-bottom:.8rem">
    <div style="overflow-x:auto"><table class="table"><thead><tr><th>Nombre</th><th>Curso</th><th>Correo</th><th>Rol</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
  const opts = (sel) => r.data.map((x) => `<option value="${x.id}"${x.id === sel ? " selected" : ""}>${esc(x.name)}</option>`).join("");
  function draw(q = "") {
    $("#rows", root).innerHTML = u.data.filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(q)).map((p) => {
      const mine = p.id === access.id, edit = manage || mine;
      return `<tr data-id="${p.id}"><td><input name="n" value="${esc(p.full_name)}" maxlength="120" ${edit ? "" : "disabled"}></td><td><input name="c" value="${esc(p.course)}" maxlength="60" ${edit ? "" : "disabled"}></td>
        <td class="muted">${esc(p.email)}</td><td><select name="r" ${manage && !mine ? "" : "disabled"}>${opts(p.role_id)}</select></td>
        <td class="actions">${edit ? `<button class="btn primary sm" data-save>Guardar</button>` : ""}</td></tr>`;
    }).join("");
  }
  draw(); $("#q", root).addEventListener("input", (e) => draw(e.target.value.toLowerCase()));
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-save]"); if (!b) return; const tr = b.closest("tr");
    await withBusy(b, async () => {
      const { error } = await sb.rpc("admin_update_profile", { p_id: tr.dataset.id, p_full_name: tr.querySelector("[name=n]").value, p_course: tr.querySelector("[name=c]").value, p_role: tr.querySelector("[name=r]").value });
      error ? showError(error) : toast("Usuario actualizado.");
    });
  });
}
