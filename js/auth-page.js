// Pantalla pública: inicio de sesión, registro, recuperación y restablecimiento de contraseña.
import { sb, CONFIG, $, $$, getAccess, login, withBusy } from "./core.js";
import { loadStudentOptions, studentFields, bindStudentFields } from "./student-options.js";

const VIEWS = ["login", "register", "forgot", "reset"];
const MSG = {
  idle: ["Tu sesión se cerró por inactividad.", "warn"],
  disabled: ["Tu cuenta no tiene acceso activo.", "err"],
  changed: ["Contraseña actualizada. Inicia sesión con la nueva."],
};
const params = new URLSearchParams(location.search);
const recovering = params.get("view") === "reset" || location.hash.includes("type=recovery");
const registerForm = $("#f-register");
let studentOptionsReady = false;
try {
  const catalog = await loadStudentOptions();
  $("#registration-course").innerHTML = studentFields(catalog);
  bindStudentFields(registerForm, catalog);
  studentOptionsReady = true;
} catch {
  $("#registration-course").textContent = "No se pudieron cargar los cursos. Recarga la página para intentarlo otra vez.";
  registerForm.querySelector("[type=submit]").disabled = true;
}

// Identidad desde la configuración
$$("[data-logo]").forEach((i) => { i.src = CONFIG.LOGO_URL; });
const nameEl = $("[data-name]");
if (nameEl) nameEl.textContent = CONFIG.APP_NAME;
const taglineEl = $("[data-tagline]");
if (taglineEl) taglineEl.textContent = CONFIG.TAGLINE;
document.title = `Acceso · ${CONFIG.APP_SHORT}`;

function note(text, kind = "") {
  const n = $("#note");
  if (!n) return;
  n.textContent = text;
  n.className = `callout ${kind}`;
  n.hidden = !text;
}
function show(name) {
  VIEWS.forEach((v) => {
    const el = $(`#v-${v}`);
    if (el) el.hidden = v !== name;
  });
  note("");
  $(`#v-${name} input`)?.focus();
}
$$("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.go); }));

if (MSG[params.get("msg")]) note(...MSG[params.get("msg")]);

// ¿Ya hay una sesión válida? Entrar directo (salvo si se está restableciendo la contraseña).
if (!recovering) {
  try {
    const { data } = await sb.auth.getSession();
    if (data?.session && await getAccess(true)) location.replace("app.html");
  } catch (err) {
    console.warn("No active session:", err);
  }
}

// El enlace "Crear una cuenta" solo aparece si el administrador abrió el registro.
try {
  const { data: mode } = await sb.rpc("public_registration_mode");
  const regBtn = $("#to-register");
  if (regBtn) regBtn.hidden = !mode || mode === "closed";
} catch (err) {
  console.warn("Registration mode check failed:", err);
}

sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") show("reset"); });

const same = (f) => f.password.value === f.again.value;

$("#f-login").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.currentTarget;
  await withBusy(f.querySelector("[type=submit]"), async () => {
    try { await login(f.email.value.trim(), f.password.value); location.replace("app.html"); }
    catch (err) { note(err.message, "err"); f.password.value = ""; }
  });
});

$("#f-register").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.currentTarget;
  if (!studentOptionsReady) return;
  if (!same(f)) return note("Las contraseñas no coinciden.", "err");
  await withBusy(f.querySelector("[type=submit]"), async () => {
    const course = f.course_id.selectedOptions[0].textContent;
    const { data, error } = await sb.auth.signUp({
      email: f.email.value.trim(), password: f.password.value,
      options: { data: {
        full_name: f.full_name.value.trim(), course: `${course} "${f.parallel.value}"`,
        course_id: f.course_id.value, parallel: f.parallel.value,
        specialty_id: f.specialty_id.disabled ? null : (f.specialty_id.value || null),
      }, emailRedirectTo: new URL("login.html", location.href).href },
    });
    // Mensaje único: no se revela si el correo ya existe ni por qué se rechazó.
    if (error) note("No pudimos completar el registro. Revisa los datos o consulta con el administrador.", "err");
    else if (data.session) {
      sessionStorage.removeItem("cs_access");
      if (await getAccess(true)) location.replace("app.html");
      else note("La cuenta se creó, pero no se pudo abrir el inicio. Intenta iniciar sesión.", "warn");
    } else note("No se pudo iniciar la sesión automáticamente. Intenta iniciar sesión o consulta con el administrador.", "warn");
  });
});

$("#f-forgot").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.currentTarget;
  await withBusy(f.querySelector("[type=submit]"), async () => {
    await sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: new URL("login.html?view=reset", location.href).href });
    note("Si el correo está registrado, recibirás un enlace para restablecer la contraseña."); // siempre igual
  });
});

$("#f-reset").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.currentTarget;
  if (!same(f)) return note("Las contraseñas no coinciden.", "err");
  await withBusy(f.querySelector("[type=submit]"), async () => {
    const { error } = await sb.auth.updateUser({ password: f.password.value });
    if (error) return note("No se pudo guardar la contraseña. Pide un nuevo enlace e inténtalo otra vez.", "err");
    await sb.auth.signOut({ scope: "local" });
    location.replace("login.html?msg=changed");
  });
});
if (location.hash === "#register") show("register");
if (recovering) show("reset");
