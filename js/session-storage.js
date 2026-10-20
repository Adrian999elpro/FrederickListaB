// Conserva la sesión entre visitas y migra la que ya existía en esta pestaña.
export function persistentSessionStorage(local, tab) {
  return {
    getItem(key) {
      let value = local.getItem(key);
      if (value === null) {
        value = tab.getItem(key);
        if (value !== null) local.setItem(key, value);
      }
      tab.removeItem(key);
      return value;
    },
    setItem(key, value) {
      local.setItem(key, value);
      tab.removeItem(key);
    },
    removeItem(key) {
      local.removeItem(key);
      tab.removeItem(key);
    },
  };
}
