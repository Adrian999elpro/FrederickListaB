// Pagina el texto guardado según el espacio real, sin modificarlo en la base de datos.
export function planBlocks(source) {
  const text = String(source ?? "").replace(/\r\n?/g, "\n");
  return [...text.matchAll(/\S[^]*?(?=\n[ \t]*\n|$)/g)].map((match) => {
    const value = match[0].trimEnd();
    const section = value.length < 100 && !value.includes("\n") && value !== value.toLocaleLowerCase("es") && value === value.toLocaleUpperCase("es");
    const subheading = /^(por la |durante la |en la )?(mañana|noche|tarde)$/i.test(value);
    return { text: value, start: match.index, end: match.index + value.length, kind: section ? "section" : subheading ? "subheading" : "body" };
  });
}

function boundaries(text, type) {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter("es", { granularity: type }).segment(text)].map((s) => s.index + s.segment.length);
  }
  return type === "sentence"
    ? [...text.matchAll(/[.!?…](?:\s+|$)/g)].map((m) => m.index + m[0].length)
    : Array.from({ length: text.length }, (_, i) => i + 1);
}

function piece(block, from, to) {
  const raw = block.text.slice(from, to), leading = raw.length - raw.trimStart().length;
  const text = raw.trim();
  return { ...block, text, start: block.start + from + leading, end: block.start + from + leading + text.length };
}

// fits recibe los bloques que se quieren mostrar juntos. También se usa en las pruebas.
export function paginatePlan(blocks, fits) {
  const pages = []; let page = [];
  const flush = () => { if (page.length) pages.push(page); page = []; };
  for (let i = 0; i < blocks.length; i++) {
    const group = [blocks[i]];
    // Un título siempre acompaña a su subtítulo y al inicio de la propuesta siguiente.
    while (group.at(-1).kind !== "body" && i + 1 < blocks.length) group.push(blocks[++i]);
    if (fits([...page, ...group])) { page.push(...group); continue; }
    flush();
    if (fits(group)) { page = group; continue; }
    let prefix = group.slice(0, -1), rest = group.at(-1);
    while (rest.text) {
      if (fits([...prefix, rest])) { page = [...prefix, rest]; break; }
      const largestFit = (positions) => {
        let low = 0, high = positions.length - 1, best = 0;
        while (low <= high) {
          const mid = (low + high) >> 1, cut = positions[mid];
          if (fits([...prefix, piece(rest, 0, cut)])) { best = cut; low = mid + 1; }
          else high = mid - 1;
        }
        return best;
      };
      // Solo una propuesta demasiado larga se divide: primero por oraciones y luego por palabras.
      let cut = largestFit(boundaries(rest.text, "sentence"));
      if (!cut) cut = largestFit([...rest.text.matchAll(/\s+/g)].map((m) => m.index).filter(Boolean));
      // Respaldo para un único enlace o token mayor que toda la página.
      if (!cut) cut = largestFit(boundaries(rest.text, "grapheme"));
      if (!cut) throw new Error("El espacio del plan es demasiado pequeño para el tamaño del texto.");
      page = [...prefix, piece(rest, 0, cut)]; flush();
      rest = piece(rest, cut, rest.text.length); prefix = [];
    }
  }
  flush();
  return pages;
}

export function mountPlanPager(frame, content, controls) {
  const previous = controls.querySelector("[data-plan-previous]"), next = controls.querySelector("[data-plan-next]"), status = controls.querySelector("[data-plan-status]");
  const measure = document.createElement("div");
  measure.className = "plan-content plan-measure"; measure.setAttribute("aria-hidden", "true"); frame.append(measure);
  let blocks = [], pages = [], current = 0, pending = 0, width = 0;

  function nodes(items) {
    return items.map((block) => {
      const el = document.createElement(block.kind === "section" ? "h3" : block.kind === "subheading" ? "h4" : "p");
      const lines = block.text.split("\n");
      if (block.kind === "body" && lines.length > 1 && /^(?:[•*\-–]|\d+[.)])\s/.test(lines[0])) {
        const title = document.createElement("strong"); title.textContent = lines.shift();
        el.append(title, document.createElement("br"), document.createTextNode(lines.join("\n")));
      } else el.textContent = block.text;
      return el;
    });
  }

  function show() {
    content.replaceChildren(...nodes(pages[current] ?? []));
    status.textContent = `Página ${current + 1} de ${pages.length}`;
    previous.disabled = current === 0; next.disabled = current === pages.length - 1;
    controls.hidden = pages.length <= 1;
    frame.classList.toggle("plan-single", pages.length <= 1);
  }

  function layout(reset = false) {
    const anchor = reset ? 0 : (pages[current]?.[0]?.start ?? 0);
    frame.classList.remove("plan-single");
    const height = frame.clientHeight - 2; width = frame.clientWidth;
    if (width < 1 || height < 1) return;
    pages = paginatePlan(blocks, (items) => {
      measure.replaceChildren(...nodes(items));
      return measure.getBoundingClientRect().height <= height;
    });
    measure.replaceChildren();
    current = Math.max(0, pages.findIndex((page) => page.at(-1).end > anchor));
    show();
  }
  function schedule() { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => layout()); }
  function move(by) {
    const target = current + by;
    if (target < 0 || target >= pages.length) return;
    current = target; show();
  }
  previous.addEventListener("click", () => move(-1)); next.addEventListener("click", () => move(1));
  frame.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); move(e.key === "ArrowRight" ? 1 : -1); }
  });
  const observer = new ResizeObserver(() => { if (frame.clientWidth !== width) schedule(); }); observer.observe(frame);
  window.addEventListener("resize", schedule);
  document.fonts?.ready.then(schedule);
  return {
    setText(text) {
      blocks = planBlocks(text || "El plan de trabajo se publicará pronto.");
      if (!blocks.length) blocks = planBlocks("El plan de trabajo se publicará pronto.");
      current = 0; pages = []; layout(true);
    },
  };
}
