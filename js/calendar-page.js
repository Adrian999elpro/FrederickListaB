// Página pública del calendario (sin iniciar sesión).
import { sb, $, showError } from "./core.js?v=20261020e";
import { loadSite, applyTheme, chrome } from "./site.js?v=20261020e";
import { mountCalendar } from "./calendar.js?v=20261020e";
const [site, ev, sl, { data: { session } }] = await Promise.all([loadSite(),
  sb.from("events").select("id,title,event_date,details").order("event_date"),
  sb.from("slates").select("name").order("position").limit(1), sb.auth.getSession()]);
applyTheme(site); chrome(site, { brand: sl.data?.[0]?.name ?? "Consejo Estudiantil", session, active: "cal" });
if (ev.error) showError(ev.error); mountCalendar($("#cal"), ev.data ?? []);
