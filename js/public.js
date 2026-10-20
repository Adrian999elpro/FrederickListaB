// Portada pública: se ve sin iniciar sesión. Todo lo que lee lo permite RLS para el rol anónimo.
import { sb, $, esc, mediaUrl, showError } from "./core.js";
import { loadSite, applyTheme, chrome, videoHtml, socialHtml } from "./site.js";

const [site, s, r, m, { data: { session } }] = await Promise.all([loadSite(),
  sb.from("slates").select("*").order("position").order("created_at"),
  sb.from("ranks").select("*").order("position"), sb.from("members").select("*").order("position"), sb.auth.getSession()]);
const err = s.error || r.error || m.error; if (err) showError(err);
applyTheme(site);
const slates = s.data ?? []; let cur = 0;
const brand = () => slates[cur]?.name ?? "Consejo Estudiantil";

// Secciones bajo la portada, en el orden y con los títulos que eligió el administrador.
const video = videoHtml(site.video), socials = socialHtml(site.socials, false);
const BODY = {
  video: () => (video ? `<div class="video-box reveal">${video}</div>` : ""),
  equipo: () => `<div id="team"></div>`,
  redes: () => (socials ? `<div class="soc-row reveal">${socials}</div>` : ""),
};
$("#sections").innerHTML = site.sections.filter((x) => x.on && BODY[x.id]?.()).map((x) => `<section id="${x.id}" class="wrap"><h2 class="sec-title reveal">${esc(x.title)}</h2>${BODY[x.id]()}</section>`).join("");
$("#join").innerHTML = session ? "" : `<div class="card reveal"><h2>¿Tienes ideas para el colegio?</h2><p class="muted">Regístrate para chatear con los demás estudiantes y enviarnos tus sugerencias y necesidades.</p><a class="btn primary" href="login.html#register">Crear cuenta o ingresar</a></div>`;

function show() {
  const sl = slates[cur];
  chrome(site, { brand: brand(), session, active: "home" });
  if (!sl) { $("#hero-name").textContent = "Aún no hay lista publicada"; return; }
  document.title = `${sl.name} · Consejo Estudiantil`;
  $("#hero-name").textContent = sl.name; $("#hero-motto").textContent = sl.motto ? `“${sl.motto}”` : "";
  $("#plan").textContent = sl.plan || "El plan de trabajo se publicará pronto.";
  const logo = $("#hero-logo"); logo.hidden = !sl.logo_path; if (sl.logo_path) logo.src = mediaUrl(sl.logo_path);
  $("#tabs").hidden = slates.length < 2;
  $("#tabs").innerHTML = slates.map((x, i) => `<button class="btn ghost sm${i === cur ? " active" : ""}" data-i="${i}">${esc(x.name)}</button>`).join("");

  const people = (m.data ?? []).filter((p) => p.slate_id === sl.id), ranks = (r.data ?? []).filter((x) => x.slate_id === sl.id);
  const groups = ranks.map((rk) => ({ title: rk.name, list: people.filter((p) => p.rank_id === rk.id) }));
  const loose = people.filter((p) => !ranks.some((rk) => rk.id === p.rank_id)); if (loose.length) groups.push({ title: "Integrantes", list: loose });
  let i = 0;
  const team = $("#team"); if (team) {
    const cards = groups.flatMap((g) => g.list.map((p) => `<article class="card member reveal" style="--i:${i++ % 8}">
      <h3 class="member-rank">${esc(g.title)}</h3><div class="member-main">
      ${p.photo_path ? `<img class="avatar" src="${esc(mediaUrl(p.photo_path))}" alt="Foto de ${esc(p.full_name)}" loading="lazy">` : `<div class="avatar" aria-hidden="true">${esc(p.full_name.trim()[0]?.toUpperCase() ?? "?")}</div>`}
      <div class="member-info"><h4>${esc(p.full_name)}</h4><p class="course">${esc(p.course)}</p>${p.motto ? `<q>${esc(p.motto)}</q>` : ""}</div>
      </div></article>`)).join("");
    team.innerHTML = cards ? `<div class="team-grid">${cards}</div>` : `<p class="muted">Los integrantes se publicarán pronto.</p>`;
  }
  observe();
}
$("#tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) { cur = +b.dataset.i; show(); } });
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
function observe() { document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el)); }
show(); observe();
