import fs from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { documentCases, documentFixture } from "./fixtures.js";
import { renderDocumentCase } from "./render.js";

const require = createRequire(import.meta.url);
const runtime = join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies");
const bundledRequire = createRequire(join(runtime, "node/node_modules/__document_test__.cjs"));
const { chromium } = (() => { try { return require("playwright"); } catch { return bundledRequire("playwright"); } })();
const { PDFDocument } = bundledRequire("pdf-lib");
const python = process.env.AND_OS_PDF_PYTHON || join(runtime, "python/python.exe");
const canvasApi = bundledRequire("@napi-rs/canvas");
globalThis.DOMMatrix = canvasApi.DOMMatrix;
globalThis.Path2D = canvasApi.Path2D;
globalThis.ImageData = canvasApi.ImageData;
const { getDocument } = await import(pathToFileURL(bundledRequire.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
const artifacts = resolve("tests/os/document-output/artifacts");
fs.mkdirSync(artifacts, { recursive: true });
const css = fs.readFileSync("public/os-app/styles.css", "utf8") + "\n" + fs.readFileSync("public/os-app/document-print.css", "utf8");
const logo = "data:image/png;base64," + fs.readFileSync("public/logo.png").toString("base64");
const browser = await chromium.launch({ channel: process.env.AND_OS_PRINT_CHANNEL || "msedge", headless: true });
const report = { engine: browser.version(), syntheticOnly: true, cases: [] };
try {
  for (const entry of documentCases) {
    const fixture = documentFixture(entry);
    const before = JSON.stringify(fixture);
    const rendered = renderDocumentCase(entry, fixture);
    assert.equal(JSON.stringify(fixture), before);
    const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>${css}</style><body><div id="appShell"><button>PRINT_CONTROL_LEAK_SENTINEL</button></div>${rendered.replaceAll('src="/logo.png"', `src="${logo}"`)}</body></html>`;
    fs.writeFileSync(join(artifacts, `${entry.name}.html`), html);
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.route("**/*", route => route.abort());
    await page.emulateMedia({ media: "print" });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const sheet = document.getElementById("printQuoteSheet");
      const root = sheet.getBoundingClientRect();
      const targets = [...sheet.querySelectorAll("td, th, h1, h2, dd, .contract-print-signature")];
      return { leakedControls: getComputedStyle(document.getElementById("appShell")).display !== "none",
        overflow: targets.filter(node => node.scrollWidth > node.clientWidth + 2 || node.getBoundingClientRect().right > root.right + 2).map(node => node.textContent.slice(0, 60)),
        articles: [...sheet.querySelectorAll("article")].map(node => node.querySelector("h1").textContent),
      };
    });
    assert.equal(layout.leakedControls, false);
    assert.deepEqual(layout.overflow, []);
    await page.screenshot({ path: join(artifacts, `${entry.name}-screen.png`), fullPage: false });
    const path = join(artifacts, `${entry.name}.pdf`);
    const buffer = await page.pdf({ path, preferCSSPageSize: true, printBackground: false, displayHeaderFooter: false });
    const pdf = await PDFDocument.load(buffer);
    const pages = pdf.getPages();
    for (const p of pages) { assert(Math.abs(p.getWidth() - 595.28) < 1); assert(Math.abs(p.getHeight() - 841.89) < 1); }
    const textPath = join(artifacts, `${entry.name}-bbox.html`);
    const extraction = spawnSync(python, ["tests/os/document-output/inspect_pdf.py", path], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    assert.equal(extraction.status, 0, extraction.stderr || String(extraction.error));
    fs.writeFileSync(textPath, extraction.stdout);
    const xml = new JSDOM(fs.readFileSync(textPath, "utf8"), { contentType: "application/xhtml+xml" });
    const pdfPages = [...xml.window.document.querySelectorAll("page")];
    const words = pdfPages.map(p => [...p.querySelectorAll("word")]);
    const text = words.flat().map(w => w.textContent).join(" ");
    const compact = text.replace(/\s/g, "");
    assert(!/PRINT_CONTROL_LEAK_SENTINEL|PRIVATE_\w+_SENTINEL|987,654,321|internalSummary|costSnapshot/.test(text));
    let orphanHeadings = 0;
    let boundaryOverflow = 0;
    let footerCollisions = 0;
    for (const p of pdfPages) {
      const height = Number(p.getAttribute("height"));
      const width = Number(p.getAttribute("width"));
      for (const word of p.querySelectorAll("word")) if (Number(word.getAttribute("xMin")) < -1 || Number(word.getAttribute("xMax")) > width + 1 || Number(word.getAttribute("yMax")) > height + 1) boundaryOverflow++;
      const bodyLines = [...p.querySelectorAll("line")].filter(line => Number(line.getAttribute("yMin")) < height - 38);
      assert(bodyLines.length > 1, "Blank or footer-only page");
      footerCollisions += bodyLines.flatMap(line => [...line.querySelectorAll("word")]).filter(word => Number(word.getAttribute("yMax")) > height - 46).length;
      const last = bodyLines.at(-1)?.textContent.replace(/\s+/g, " ").trim() || "";
      if (/^(제\d+[조장]|계약 일반조건|서명 및 날인)/.test(last)) orphanHeadings++;
    }
    assert.equal(boundaryOverflow, 0);
    assert.equal(orphanHeadings, 0);
    assert.equal(footerCollisions, 0);
    const hasQuote = ["QUOTE", "ALL", "ESTIMATE"].includes(entry.type);
    const hasSpec = ["SPEC", "ALL"].includes(entry.type);
    let splitRows = 0;
    for (const prefix of [hasQuote ? "Q" : null, hasSpec ? "S" : null].filter(Boolean)) for (let i = 0; i < entry.count; i++) {
      const start = `${prefix}${String(i).padStart(4, "0")}`;
      const end = `${prefix}E${String(i).padStart(4, "0")}`;
      const startPage = words.findIndex(list => list.some(w => w.textContent.includes(start)));
      const endPage = words.findIndex(list => list.some(w => w.textContent.includes(end)));
      assert(startPage >= 0 && endPage >= 0, `Missing row ${start}`);
      if (startPage !== endPage) splitRows++;
    }
    assert.equal(splitRows, 0);
    if (entry.type === "ESTIMATE_SUMMARY") {
      assert(compact.includes(fixture.quote.totalText.replace(/\s/g, "")), "Missing customer total");
      assert(!/Q\d{4}|QE\d{4}/.test(text), "Summary leaked detailed customer items");
      for (let index = 0; index < fixture.quote.groups.length; index++) {
        const start = `T${String(index).padStart(4, "0")}`;
        const end = `TE${String(index).padStart(4, "0")}`;
        const startPage = words.findIndex(list => list.some(w => w.textContent.includes(start)));
        const endPage = words.findIndex(list => list.some(w => w.textContent.includes(end)));
        assert(startPage >= 0 && startPage === endPage, `Missing or split summary trade ${start}`);
      }
    }
    if (entry.type === "CONTRACT" || entry.type === "ALL") {
      for (const line of fixture.documents[0].content_json.generated_sections.fixed_term_lines) assert(compact.includes(line.replace(/\s/g, "")), `Missing clause: ${line.slice(0, 40)}`);
      assert(compact.includes("서명및날인"));
    }
    if (entry.name.endsWith("small")) assert.equal(pages.length, 1);
    if (entry.name === "quote-normal") assert(pages.length >= 2 && pages.length <= 3);
    if (entry.name === "quote-large" || entry.name === "spec-large") assert(pages.length >= 5);
    if (entry.type === "ALL") assert.deepEqual(layout.articles, ["인테리어 공사계약서", "공사 견적서", "공사사양서"]);
    // PDF.js preserves Chromium's saved PDF text transforms; inspect every physical page.
    const raster = await getDocument({ data: new Uint8Array(buffer) }).promise;
    for (let number = 1; number <= pages.length; number++) {
      const pdfPage = await raster.getPage(number);
      const viewport = pdfPage.getViewport({ scale: 1.65 });
      const canvas = canvasApi.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");
      await pdfPage.render({ canvasContext: context, viewport }).promise;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 16) if (pixels[i] < 180 && pixels[i + 1] < 180 && pixels[i + 2] < 180) ink++;
      assert(ink > 100, "Blank raster page");
      fs.writeFileSync(join(artifacts, `${entry.name}-page-${number}.png`), canvas.toBuffer("image/png"));
    }
    await raster.destroy();
    const result = { name: entry.name, pages: pages.length, overflow: layout.overflow.length, boundaryOverflow, orphanHeadings, splitRows, footerCollisions, blankPages: 0, controlLeakage: false, articles: layout.articles };
    report.cases.push(result);
    console.log(JSON.stringify(result));
    xml.window.close();
    await page.close();
  }
} finally {
  fs.writeFileSync(join(artifacts, "report.json"), JSON.stringify(report, null, 2) + "\n");
  await browser.close();
}
console.log(`Document output: ${report.cases.length}/${documentCases.length} PASS; artifacts=${artifacts}`);
