import { sb, esc, toast, showError, withBusy } from "../core.js?v=20261020e";
import { loadStudentOptions, studentFields, bindStudentFields } from "../student-options.js?v=20261020e";
export async function render(root, access) {
  const [catalog, result] = await Promise.all([loadStudentOptions(), sb.from("profiles").select("full_name,course,course_id,parallel,specialty_id,role_id").eq("id", access.id).single()]);
  if (result.error) throw result.error;
  const p = result.data;
  root.innerHTML = `<section class="card"><h2>👤 Mi perfil</h2><p>${esc(p.full_name || "Estudiante")}</p>
    <h3>Mi curso y especialidad</h3><p class="muted">Mantén estos datos al día para que el consejo pueda organizar tus solicitudes.</p>
      ${!p.course_id && p.course ? `<p class="hint">Curso anterior: ${esc(p.course)}</p>` : ""}
      <form class="form">${studentFields(catalog,p)}<div class="row end"><button class="btn primary">Guardar mis datos</button></div></form></section>`;
  const form = root.querySelector("form"); bindStudentFields(form,catalog);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await withBusy(form.querySelector("button"), async () => {
      const v = new FormData(form);
      const { error } = await sb.rpc("set_student_profile", { p_id: access.id, p_full_name: p.full_name, p_course_id: v.get("course_id"), p_parallel: v.get("parallel"), p_specialty_id: v.get("specialty_id") || null, p_role: p.role_id });
      if (error) return showError(error);
      sessionStorage.removeItem("cs_access"); toast("Tus datos se guardaron.");
    });
  });
}
