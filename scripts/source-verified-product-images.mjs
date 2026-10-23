import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/mateo/Downloads/LISTA PROARQUEROS PRODUCTOS oct 2024.xlsx";
const outputDir = "C:/Users/mateo/OneDrive/Documentos/ChatGPT/NACHO/outputs/productos-verificados";
const imageDir = path.join(outputDir, "imagenes");
const limit = Number.parseInt(process.env.PRODUCT_LIMIT ?? "198", 10);
const start = Number.parseInt(process.env.PRODUCT_START ?? "0", 10);

const brandRanges = [
  [2, 47, "VGFC"], [53, 82, "HO Soccer"], [86, 92, "Glo-W Pro"],
  [95, 137, "Prostar"], [139, 140, "Ally Sport"], [142, 154, "DRB"],
  [158, 160, "Reebok"], [163, 167, "Accesorios"], [168, 170, "DRB"],
  [175, 217, "Reusch"], [223, 224, "Solo Porteros"], [227, 228, "Elite"],
  [235, 241, "Uhlsport"], [243, 259, "N1"], [261, 275, "CH1"],
  [278, 282, "Fitipadi"], [290, 292, "Adidas"], [294, 298, "CH1"],
  [301, 304, "Munich"], [305, 309, "Dreamgol"], [312, 323, "Accesorios"],
  [326, 334, "MB1"], [337, 340, "Indumentaria"], [342, 353, "Medias"],
  [355, 357, "Calzado"],
];

const clean = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const meaningfulTerms = (value) => clean(value).split(" ").filter((term) => term.length >= 3 && !["guante", "guantes", "arquero", "portero", "goalkeeper", "gloves", "para", "con"].includes(term));
const safeName = (value) => clean(value).replace(/\s+/g, "-").slice(0, 110);
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const officialImage = new Map([
  ["VGFC|ZULU IV", "https://www.vgfcgloves.com.ar/images/products/zulu.png"],
  ["VGFC|AXUM", "https://www.vgfcgloves.com.ar/images/products/axum.png"],
  ["VGFC|BASEL", "https://www.vgfcgloves.com.ar/images/products/basel.png"],
  ["VGFC|IMPERIO", "https://www.vgfcgloves.com.ar/images/products/imperio.png"],
  ["VGFC|RIO", "https://www.vgfcgloves.com.ar/images/products/rio.png"],
  ["VGFC|MOLDES", "https://www.vgfcgloves.com.ar/images/products/moldes.png"],
  ["VGFC|SPIDER", "https://www.vgfcgloves.com.ar/images/products/spider.png"],
  ["VGFC|AXUM LEGEND", "https://www.vgfcgloves.com.ar/images/products/axum-legend.png"],
]);

const queryAliases = new Map([
  ["HO Soccer|TERMICA", "HO Soccer ropa termica goalkeeper"],
  ["Reusch|TERMICA", "Reusch indumentaria termica arquero"],
  ["Reusch|PARCK CHUPIN", "Reusch Prince Park chupin arquero"],
  ["Reusch|PRINCES PARK", "Reusch Prince Park pantalon arquero"],
  ["Reusch|ATTRAKT INFINITY EVOLUCION NC", "Reusch Attrakt Infinity Evolution NC"],
  ["Reusch|ATTRAK SOLID", "Reusch Attrakt Solid goalkeeper gloves"],
  ["Reusch|ATTRAKT PRO FUSION ADVANCE", "Reusch Attrakt Pro Fusion Advance"],
  ["Reusch|ATTRAK PRO AQUA ADVANCE", "Reusch Attrakt Pro Aqua Advance"],
  ["Reusch|ATTRAK PRO INFINITY", "Reusch Attrakt Pro Infinity"],
  ["Reusch|ATTRAK FREEGEL ADVANCE", "Reusch Attrakt Freegel Advance"],
  ["Reusch|FASTGRIP PRIME AQUA", "Reusch Fastgrip Prime Aqua"],
  ["Reusch|ATTRACK PRO FUSION", "Reusch Attrakt Pro Fusion"],
  ["Reusch|FASTGRIP INFINITY", "Reusch Fastgrip Infinity"],
]);

const decodeJsonString = (value) => {
  try { return JSON.parse(`"${value.replace(/\\"/g, '\\\"')}"`); } catch { return value.replace(/\\u002f/gi, "/").replace(/\\\//g, "/"); }
};

function candidatesFromBing(html) {
  const candidates = [];
  for (const match of html.matchAll(/purl&quot;:&quot;(.+?)&quot;.*?murl&quot;:&quot;(.+?)&quot;.*?t&quot;:&quot;(.+?)&quot;/g)) {
    candidates.push({ pageUrl: decodeJsonString(match[1]), imageUrl: decodeJsonString(match[2]), title: decodeJsonString(match[3]) });
  }
  return candidates;
}

function matchesExactProduct(candidate, brand, product) {
  const text = clean(`${candidate.title} ${candidate.pageUrl}`);
  const productTerms = meaningfulTerms(product);
  const brandTerms = meaningfulTerms(brand);
  const brandOk = brandTerms.length === 0 || brandTerms.every((term) => text.includes(term));
  const found = productTerms.filter((term) => text.includes(term)).length;
  // Listings often omit a color, size, or the catalogue's misspelling. Keep the
  // brand mandatory and require the identifying core of the model name.
  const required = productTerms.length <= 2 ? productTerms.length : Math.ceil(productTerms.length * 0.67);
  return brandOk && productTerms.length > 0 && found >= required;
}

function extension(contentType, imageUrl) {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  const urlExtension = path.extname(new URL(imageUrl).pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].includes(urlExtension) ? urlExtension : ".jpg";
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const values = workbook.worksheets.getItem("Hoja1").getRange("A1:P357").values;
const items = [];
for (let index = 1; index < values.length; index += 1) {
  const row = index + 1;
  const product = values[index][0];
  const cashPrice = values[index][4];
  if (typeof product !== "string" || !product.trim() || typeof cashPrice !== "number" || cashPrice <= 0) continue;
  const range = brandRanges.find(([start, end]) => row >= start && row <= end);
  items.push({ row, brand: range?.[2] ?? "Sin marca", product: product.trim() });
}

await fs.mkdir(imageDir, { recursive: true });
const manifestPath = path.join(outputDir, "manifest.json");
let prior = [];
try { prior = JSON.parse(await fs.readFile(manifestPath, "utf8")); } catch { /* first run */ }
const completed = new Map(prior.filter((item) => item.status === "verified image downloaded").map((item) => [item.row, item]));
const retryMissing = process.env.RETRY_MISSING === "1";
const manifest = retryMissing ? prior.filter((item) => completed.has(item.row)) : prior;

for (const item of items.slice(start, start + limit)) {
  if (completed.has(item.row)) continue;
  const alias = queryAliases.get(`${item.brand}|${item.product.toUpperCase()}`);
  const query = alias ?? `\"${item.brand} ${item.product}\"`;
  let record = { ...item, query, status: "no verified image found", sourcePage: "", imageUrl: "", file: "", description: "" };
  try {
    const officialUrl = officialImage.get(`${item.brand}|${item.product.toUpperCase()}`);
    const result = officialUrl ? null : await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "accept-language": "es-AR,es;q=0.9,en;q=0.8" },
    });
    const candidates = result?.ok ? candidatesFromBing(await result.text()) : [];
    const candidate = officialUrl ? { imageUrl: officialUrl, pageUrl: "https://www.vgfcgloves.com.ar/", title: `${item.brand} ${item.product}` } : candidates.find((entry) => matchesExactProduct(entry, item.brand, item.product));
    if (candidate) {
      const imageResult = await fetch(candidate.imageUrl, { headers: { "user-agent": "Mozilla/5.0", referer: candidate.pageUrl } });
      const contentType = imageResult.headers.get("content-type") ?? "";
      const bytes = new Uint8Array(await imageResult.arrayBuffer());
      if (imageResult.ok && contentType.startsWith("image/") && bytes.byteLength > 4_000) {
        const file = `${String(item.row).padStart(3, "0")}-${safeName(item.brand)}-${safeName(item.product)}${extension(contentType, candidate.imageUrl)}`;
        await fs.writeFile(path.join(imageDir, file), bytes);
        record = { ...record, status: "verified image downloaded", sourcePage: candidate.pageUrl, imageUrl: candidate.imageUrl, file, description: candidate.title };
        console.log(`OK ${item.row}: ${item.brand} ${item.product}`);
      }
    }
  } catch (error) {
    record.status = `error: ${error instanceof Error ? error.message.slice(0, 100) : "unknown"}`;
  }
  manifest.push(record);
  await fs.writeFile(manifestPath, JSON.stringify(manifest.sort((a, b) => a.row - b.row), null, 2));
  await sleep(800);
}
const count = manifest.filter((item) => item.status === "verified image downloaded").length;
console.log(JSON.stringify({ processed: manifest.length, downloaded: count, imageDir }));
