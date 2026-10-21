// Valores públicos por diseño (clave anon/publishable). NUNCA pongas aquí la clave service_role.
export const CONFIG = {
  SUPABASE_URL: "https://kctnaxhyisaphnygrmkb.supabase.co",      // ← pega la URL de TU proyecto Supabase (uno nuevo, distinto al de Frederick)
  SUPABASE_ANON_KEY: "sb_publishable_uTE7T27KhdTOTkASksIW_A_yCkdp58c",             // ← Settings → API → publishable/anon key
  APP_NAME: "Lista A", APP_SHORT: "LISTA A", TAGLINE: "Tu voz cuenta",
  LOGO_URL: "img/sello.png",
  ACCESS_TTL_MS: 5 * 60_000, MIN_PASSWORD: 10,
};
