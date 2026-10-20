// Ajustes personalizables del sitio: se guardan en site_settings ('site') y se aplican en la página pública y en el panel.
import { sb, esc, mediaUrl } from "./core.js?v=20261020c";

export const DEFAULTS = {
  school: "Unidad Educativa Técnica Particular Frederick Winslow Taylor", seal: null, show_seal: true,
  theme: { primary: "#a81717", accent: "#f59e0b", font: "moderna", radius: "suave", motion: "completa", hero: "centrada", hero_image: null },
  sections: [{ id: "video", on: true, title: "Conócenos" }, { id: "equipo", on: true, title: "Nuestro equipo" }, { id: "redes", on: true, title: "Síguenos" }],
  video: { url: "", path: null }, socials: [],
};
export const NETS = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", x: "X (Twitter)", whatsapp: "WhatsApp", telegram: "Telegram", twitch: "Twitch", discord: "Discord", spotify: "Spotify", web: "Sitio web", correo: "Correo" };
export const PRESETS = { Rojo: ["#a81717", "#f59e0b"], Azul: ["#1d4ed8", "#38bdf8"], Verde: ["#15803d", "#facc15"], Morado: ["#7e22ce", "#f472b6"], Naranja: ["#c2410c", "#fbbf24"], Negro: ["#111827", "#f59e0b"] };

export async function loadSite() {
  const { data } = await sb.from("site_settings").select("value").eq("key", "site").maybeSingle();
  const v = data?.value ?? {}, saved = (v.sections ?? []).filter((s) => DEFAULTS.sections.some((d) => d.id === s.id));
  DEFAULTS.sections.forEach((d) => { if (!saved.some((s) => s.id === d.id)) saved.push({ ...d }); });
  return { ...DEFAULTS, ...v, theme: { ...DEFAULTS.theme, ...v.theme }, video: { ...DEFAULTS.video, ...v.video }, socials: v.socials ?? [], sections: saved };
}
export const sealSrc = (site) => (site.seal ? mediaUrl(site.seal) : "img/sello.png");

const FONTS = { moderna: 'system-ui, "Segoe UI", Roboto, sans-serif', elegante: 'Georgia, "Times New Roman", serif', redondeada: 'ui-rounded, "Trebuchet MS", "Segoe UI", sans-serif' };
const RADII = { recto: ["4px", "2px", "6px"], suave: ["14px", "10px", "20px"], pildora: ["26px", "18px", "34px"] };
const hex = (c, d) => (/^#[0-9a-f]{6}$/i.test(c) ? c : d);

export function applyTheme(site) {
  const t = site.theme, P = hex(t.primary, DEFAULTS.theme.primary), A = hex(t.accent, DEFAULTS.theme.accent), [r, s, l] = RADII[t.radius] ?? RADII.suave, f = FONTS[t.font] ?? FONTS.moderna;
  let el = document.getElementById("site-theme"); if (!el) { el = document.createElement("style"); el.id = "site-theme"; document.head.append(el); }
  el.textContent = `:root{--brand:${P};--accent-gold:${A};--brand-deep:color-mix(in srgb,${P} 70%,#000);--brand-text:${P};--brand-soft:color-mix(in srgb,${P} 9%,var(--surface));--brand-light:color-mix(in srgb,${P} 6%,var(--surface));--brand-border:color-mix(in srgb,${P} 28%,var(--surface));--brand-ring:color-mix(in srgb,${P} 24%,transparent);--font-body:${f};--font-head:${f};--radius:${r};--radius-sm:${s};--radius-lg:${l}}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--brand-text:color-mix(in srgb,${P} 55%,#fff)}}:root[data-theme=dark]{--brand-text:color-mix(in srgb,${P} 55%,#fff)}`;
  const h = document.documentElement; h.dataset.motion = t.motion; h.dataset.hero = t.hero;
  t.hero_image ? h.style.setProperty("--hero-img", `url("${mediaUrl(t.hero_image)}")`) : h.style.removeProperty("--hero-img");
}

/* ---------- Video (YouTube, Vimeo, MP4/WEBM por enlace o subido) ---------- */
export function videoHtml(v) {
  const u = (v.url || "").trim(); let m;
  if (v.path) return `<video controls playsinline preload="metadata" src="${esc(mediaUrl(v.path))}"></video>`;
  if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/))) return `<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Video" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  if ((m = u.match(/vimeo\.com\/(\d+)/))) return `<iframe src="https://player.vimeo.com/video/${m[1]}" title="Video" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  if (/^https:\/\/[^\s"'<>]+\.(mp4|webm)(\?[^\s"'<>]*)?$/i.test(u)) return `<video controls playsinline preload="metadata" src="${esc(u)}"></video>`;
  return "";
}

/* ---------- Redes sociales ---------- */
function safeUrl(net, u) {
  u = (u || "").trim();
  if (net === "whatsapp" && /^\+?[\d\s-]{7,16}$/.test(u)) return `https://wa.me/${u.replace(/\D/g, "")}`;
  if (net === "correo") return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(u) ? `mailto:${u}` : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : "";
}
export function socialHtml(list, compact) {
  return list.map((s) => ({ ...s, href: safeUrl(s.net, s.url) })).filter((s) => s.href && NETS[s.net]).map((s) => {
    const slug = s.net === "x" ? "x" : s.net, icon = ["web", "correo"].includes(s.net) ? (s.net === "web" ? "🌐" : "✉️") : `<span class="ico" style="--i:url(https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/${slug}.svg)"></span>`;
    return `<a class="soc${compact ? " mini" : ""}" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(NETS[s.net])}" title="${esc(NETS[s.net])}">${icon}<span class="t">${esc(NETS[s.net])}</span></a>`;
  }).join("");
}

/* ---------- Cabecera y pie compartidos por las páginas públicas ---------- */
export function chrome(site, { brand, session, active }) {
  const seal = site.show_seal ? `<img class="seal" src="${esc(sealSrc(site))}" alt="Sello del colegio" width="40" height="40">` : "";
  document.getElementById("hdr").innerHTML = `<a class="pub-brand" href="index.html">${seal}<span class="brand-text"><strong>${esc(brand)}</strong>${site.school ? `<small>${esc(site.school)}</small>` : ""}</span></a>
    <nav class="pub-nav"><a href="index.html#equipo"${active === "home" ? "" : ""}>Equipo</a><a href="calendario.html"${active === "cal" ? ' aria-current="page"' : ""}>Calendario</a></nav>
    <div class="row">${session ? `<a class="btn primary sm" href="app.html">Ir al panel</a>` : `<a class="btn ghost sm" href="login.html">Ingresar</a><a class="btn primary sm" href="login.html#register">Registrarme</a>`}</div>`;
  document.getElementById("ftr").innerHTML = `${site.show_seal ? `<img class="foot-seal" src="${esc(sealSrc(site))}" alt="Sello del colegio" width="110" height="110">` : ""}
    ${site.school ? `<strong>${esc(site.school)}</strong>` : ""}<div class="soc-row">${socialHtml(site.socials, false)}</div><small class="muted">Hecho por y para los estudiantes · ${new Date().getFullYear()}</small>`;
}
