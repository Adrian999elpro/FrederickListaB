import assert from "node:assert/strict";
import { planBlocks, paginatePlan } from "../js/plan-pager.js";

const text = `Una introducción al plan de trabajo.\n\nHALLOWEEN E INTEGRACIÓN\n\nPor la mañana\n\n• Colada morada\nCompartiremos una jornada de convivencia.\n\nPor la noche\n\n• Cine Frederick\nVeremos una película autorizada.\n\nDEPORTES\n\n• Torneo\nHabrá fútbol sala, fútbol 11 y vóley.\n\n${"Esta es una propuesta larga con palabras completas. ".repeat(35)}`;
const normalize = (s) => s.replace(/\s+/g, " ").trim();
const fits = (limit) => (blocks) => blocks.reduce((n, block) => n + block.text.length + 20, 0) <= limit;
const blocks = planBlocks(text);
const narrow = paginatePlan(blocks, fits(210)), wide = paginatePlan(blocks, fits(450));
assert.equal(blocks.find((b) => b.text === "HALLOWEEN E INTEGRACIÓN").kind, "section");
assert.equal(blocks.find((b) => b.text === "Por la mañana").kind, "subheading");
for (const [pages, size] of [[narrow, 210], [wide, 450]]) {
  assert.equal(normalize(pages.flat().map((b) => b.text).join(" ")), normalize(text), "Every word must appear exactly once and in order");
  assert.ok(pages.every(fits(size)), "Every page must fit");
  assert.ok(pages.every((p) => p.at(-1).kind === "body"), "A heading must not be left by itself at a page end");
  assert.ok(pages.flat().every((b) => text.slice(b.start, b.end) === b.text), "Offsets must preserve the reading position after resizing");
}
assert.ok(narrow.length >= wide.length);
assert.deepEqual(paginatePlan(planBlocks("Un plan breve."), fits(210)).map((p) => p.map((b) => b.text)), [["Un plan breve."]]);
assert.deepEqual(paginatePlan(planBlocks("  \n\n  "), fits(210)), []);
const longSentence = Array.from({ length: 150 }, (_, i) => `palabra${i}`).join(" ");
const sentencePages = paginatePlan(planBlocks(longSentence), fits(120));
assert.equal(sentencePages.flat().map((b) => b.text).join(" "), longSentence, "Oversized sentences must split between whole words");
const token = "🏀".repeat(500);
const tokenPages = paginatePlan(planBlocks(token), fits(100));
assert.equal(tokenPages.flat().map((b) => b.text).join(""), token, "An oversized token must preserve every grapheme");
assert.ok(tokenPages.flat().every((b) => !b.text.includes("�")));
assert.equal(planBlocks("<img src=x onerror=alert(1)>")[0].text, "<img src=x onerror=alert(1)>");
console.log("Pagination: complete text, headings, sentences, words, graphemes and resize anchors passed.");
