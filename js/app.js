// Shell del panel del consejo: Navegación por permisos y carga diferida de cada sección.
import { CONFIG, requireAccess, can, logout, $, esc, showError } from "./core.js";

const VIEWS = [
  { id: "calendar",    title: "📅 Calendario",             load: () => import("./views/calendar.js") },
  { id: "suggestions", title: "💡 Sugerencias",            load: () => import("./views/suggestions.js") },
  { id: "chat",        title: "💬 Chat global",            load: () => import("./views/chat.js") },
  { id: "site",       title: "🎨 Diseño y contenido",    permission: "site.manage",      load: () => import("./views/site.js") },
  { id: "slate",       title: "🗳️ Lista e integrantes",   permission: "list.manage",     load: () => import("./views/slate.js") },
  { id: "events",      title: "🗓️ Gestionar eventos",     permission: "events.manage",   load: () => import("./views/events.js") },
  { id: "users",       title: "👥 Usuarios",               permission: "users.read",      load: () => import("./views/users.js") },
  { id: "roles",       title: "🛡️ Roles y permisos",      permission: "roles.manage",    load: () => import("./views/roles.js") },
  { id: "settings",    title: "⚙️ Registro",              permission: "settings.manage", load: () => import("./views/settings.js") },
  { id: "audit",       title: "📜 Auditoría",              permission: "audit.read",      load: () => import("./views/audit.js") },
];

const access = await requireAccess();
if (access) boot(access);

function boot(access) {
  const logoEl = document.querySelector("[data-logo]");
  if (logoEl) logoEl.src = CONFIG.LOGO_URL;

  const shortEl = document.querySelector("[data-short]");
  if (shortEl) shortEl.textContent = CONFIG.APP_SHORT;

  document.title = `${CONFIG.APP_NAME} · Panel`;
  $("#who").textContent = `${access.full_name || access.email} (${access.role.toUpperCase()})`;
  $("#logout").addEventListener("click", () => logout());

  // Con contraseña temporal solo se permite el perfil hasta cambiarla
  const allowed = VIEWS.filter((v) => access.must_change_password ? v.id === "chat" : (!v.permission || can(access, v.permission)));
  $("#nav").innerHTML = allowed.map((v) => `<a href="#${v.id}" data-id="${v.id}" class="nav-link" role="menuitem">${esc(v.title)}</a>`).join("");

  const menu = $("#nav"), mbtn = $("#menu-btn"), setMenu = (open) => { menu.hidden = !open; mbtn.setAttribute("aria-expanded", String(open)); };
  mbtn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(menu.hidden); });
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); mbtn.focus(); } });
  import("./site.js").then((m) => m.loadSite().then(m.applyTheme)).catch(() => {});   // colores y estilo personalizados

  let token = 0;
  async function route() {
    const mine = ++token;
    const view = allowed.find((v) => v.id === location.hash.slice(1)) ?? allowed[0];
    $("#nav").querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.id === view.id));
    $("#nav [aria-current]")?.setAttribute("aria-current", "page"); $("#menu-cur").textContent = view.title;

    const main = $("#main");
    main.innerHTML = `<div class="card center muted" style="padding: 3rem;"><p>Cargando sección...</p></div>`;

    try {
      const mod = await view.load();
      if (mine !== token) return;
      const host = document.createElement("div");
      main.replaceChildren(host);
      await mod.render(host, access);
    } catch (err) {
      if (mine === token) {
        main.innerHTML = `<div class="callout err">No se pudo cargar esta sección.</div>`;
        showError(err);
      }
    }
  }

  addEventListener("hashchange", route);
  route();
}
