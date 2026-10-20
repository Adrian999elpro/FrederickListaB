// Valores públicos por diseño (clave anon/publishable). NUNCA pongas aquí la clave service_role.
export const CONFIG = {
  SUPABASE_URL: "https://kctnaxhyisaphnygrmkb.supabase.co",      // ← pega la URL de TU proyecto Supabase (uno nuevo, distinto al de Frederick)
  SUPABASE_ANON_KEY: "sb_publishable_uTE7T27KhdTOTkASksIW_A_yCkdp58c",             // ← Settings → API → publishable/anon key
  APP_NAME: "Consejo Estudiantil", APP_SHORT: "CONSEJO", TAGLINE: "Tu voz cuenta",
  LOGO_URL: "img/sello.png'http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='50' font-size='48'%3E%F0%9F%97%B3%EF%B8%8F%3C/text%3E%3C/svg%3E",
  IDLE_MINUTES: 30, PERSIST_SESSION: false, ACCESS_TTL_MS: 5 * 60_000, MIN_PASSWORD: 10,
};
