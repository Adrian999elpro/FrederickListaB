import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { persistentSessionStorage } from "../js/session-storage.js";

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

// Existing tab sessions survive the change; a new tab recovers the saved session.
const local = storage(), oldTab = storage(), key = "test-auth-session";
oldTab.setItem(key, "old-session");
const first = persistentSessionStorage(local, oldTab);
assert.equal(first.getItem(key), "old-session");
assert.equal(oldTab.getItem(key), null);
const reopened = persistentSessionStorage(local, storage());
assert.equal(reopened.getItem(key), "old-session");
reopened.setItem(key, "refreshed-session");
oldTab.setItem(key, "stale-session");
assert.equal(first.getItem(key), "refreshed-session");
assert.equal(oldTab.getItem(key), null);
first.removeItem(key);
assert.equal(reopened.getItem(key), null);

// Exercise the real access guard without network calls or real credentials.
const source = readFileSync(new URL("../js/core.js", import.meta.url), "utf8")
  .replace(/^import .*;\r?$/gm, "")
  .replace(/^export \{ CONFIG \};\r?$/gm, "")
  .replace(/\bexport /g, "");
let response = { data: { id: "student", permissions: [] }, error: null };
let sessionError = null, signouts = 0, timers = 0, redirect = null, options;
const fakeClient = {
  rpc: async () => response,
  auth: {
    getSession: async () => ({ data: { session: { user: { id: "student" } } }, error: sessionError }),
    signInWithPassword: async () => ({ data: { session: {} }, error: null }),
    signOut: async () => { signouts++; },
    onAuthStateChange: () => {},
  },
};
const context = vm.createContext({
  CONFIG: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "test", ACCESS_TTL_MS: 300000 },
  createClient: (_url, _key, config) => { options = config; return fakeClient; },
  persistentSessionStorage, window: { localStorage: local, sessionStorage: oldTab },
  sessionStorage: oldTab, location: { replace: url => { redirect = url; } },
  setInterval: () => { timers++; }, console,
});
vm.runInContext(source, context);
assert.equal(options.auth.persistSession, true);
assert.equal(options.auth.autoRefreshToken, true);
assert.equal((await vm.runInContext("requireAccess()", context)).id, "student");
assert.equal(timers, 0, "No idle logout timer should be started");
response = { data: null, error: { message: "Temporary network failure" } };
await assert.rejects(vm.runInContext("requireAccess()", context), /conexión/);
await assert.rejects(vm.runInContext("login('test@example.test', 'synthetic')", context), /conexión/);
assert.equal(signouts, 0, "Transient errors must not sign the user out");
assert.equal(redirect, null);
sessionError = { message: "Network unavailable" };
await assert.rejects(vm.runInContext("requireAccess()", context), /sesión/);
assert.equal(signouts, 0);
sessionError = null;
response = { data: null, error: null };
assert.equal(await vm.runInContext("requireAccess()", context), null);
assert.equal(signouts, 1, "An inactive account must still lose access");
assert.equal(redirect, "login.html?msg=disabled");
await vm.runInContext("logout()", context);
assert.equal(signouts, 2, "Explicit logout must remain available");
assert.equal(redirect, "login.html");
console.log("Session persistence, migration, renewal settings, transient failures and logout: passed.");
