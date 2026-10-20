import { sb, can, esc, fmtDate, showError, $ } from "../core.js?v=20261020c";
let channel;
export async function render(root, access) {
  root.innerHTML = `<div class="card"><h2>💬 Chat global</h2><div id="log" class="chat-log" aria-live="polite"></div>
    <form id="f" class="row" style="margin-top:.8rem"><input name="body" maxlength="500" required autocomplete="off" placeholder="Escribe un mensaje…" style="flex:1"><button class="btn primary">Enviar</button></form></div>`;
  const log = $("#log", root), seen = new Set(), mod = can(access, "chat.moderate");
  const line = (m) => `<div class="msg${m.author_id === access.id ? " mine" : ""}" data-id="${m.id}"><div class="row"><b>${esc(m.author_name)}</b><span class="muted">${fmtDate(m.created_at)}</span>
    ${m.author_id === access.id || mod ? `<button class="btn ghost sm" data-del="${m.id}" title="Borrar" aria-label="Borrar mensaje">✕</button>` : ""}</div><p>${esc(m.body)}</p></div>`;
  const add = (m) => { if (seen.has(m.id)) return; seen.add(m.id); log.insertAdjacentHTML("beforeend", line(m)); log.scrollTop = log.scrollHeight; };
  const { data, error } = await sb.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return showError(error);
  data.reverse().forEach(add);
  if (channel) sb.removeChannel(channel);
  channel = sb.channel("chat-global")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => add(p.new))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (p) => log.querySelector(`[data-id="${p.old.id}"]`)?.remove())
    .subscribe();
  addEventListener("hashchange", () => { if (location.hash !== "#chat" && channel) { sb.removeChannel(channel); channel = null; } });
  const f = $("#f", root);
  f.addEventListener("submit", async (e) => {
    e.preventDefault(); const body = f.body.value.trim(); if (!body) return; f.body.value = "";
    const { data: row, error: err } = await sb.from("chat_messages").insert({ body }).select().single();
    err ? showError(err) : add(row);
  });
  log.addEventListener("click", async (e) => { const b = e.target.closest("[data-del]"); if (b) { const { error: er } = await sb.from("chat_messages").delete().eq("id", b.dataset.del); er ? showError(er) : log.querySelector(`[data-id="${b.dataset.del}"]`)?.remove(); } });
}
