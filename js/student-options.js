import { sb, esc } from "./core.js?v=20261020e";
export async function loadStudentOptions() {
  const results = await Promise.all([
    sb.from("school_courses").select("id,name,level,position").order("position").order("name"),
    sb.from("school_parallels").select("id,name").order("name"),
    sb.from("school_specialties").select("id,name").order("name"),
  ]);
  for (const r of results) if (r.error) throw r.error;
  return { courses: results[0].data, parallels: results[1].data, specialties: results[2].data };
}
export function options(items, selected = "", empty = "Selecciona una opción") {
  return `<option value="">${esc(empty)}</option>` + items.map((x) => `<option value="${esc(x.id)}"${x.id === selected ? " selected" : ""}>${esc(x.name)}</option>`).join("");
}
export function studentFields(data, student = {}) {
  return `<div class="student-fields">
    <label>Curso<select name="course_id" required>${options(data.courses, student.course_id)}</select></label>
    <label>Paralelo<select name="parallel" required>${options(data.parallels, student.parallel)}</select></label>
    <label data-specialty hidden>Especialidad<select name="specialty_id">${options(data.specialties, student.specialty_id, "Sin especialidad asignada")}</select>
      <span class="hint">${data.specialties.length ? "Elige tu especialidad si corresponde." : "El consejo todavía no ha creado especialidades."}</span></label>
  </div>`;
}
export function bindStudentFields(root, data) {
  const course = root.querySelector('[name="course_id"]'), field = root.querySelector('[data-specialty]'), specialty = root.querySelector('[name="specialty_id"]');
  function sync() {
    const bach = data.courses.some((c) => c.id === course.value && c.level === "bachillerato");
    field.hidden = !bach; specialty.disabled = !bach;
    if (!bach) specialty.value = "";
  }
  course.addEventListener("change", sync); sync();
}
export function filterFields(data) {
  return `<div class="filter-fields">
    <label>Filtrar por curso<select data-filter="course_id">${options(data.courses, "", "Todos los cursos")}</select></label>
    <label>Paralelo<select data-filter="parallel">${options(data.parallels, "", "Todos los paralelos")}</select></label>
    <label>Especialidad<select data-filter="specialty_id">${options(data.specialties, "", "Todas las especialidades")}</select></label>
  </div>`;
}
export const readFilters = (root) => Object.fromEntries([...root.querySelectorAll('[data-filter]')].map((el) => [el.dataset.filter, el.value]));
