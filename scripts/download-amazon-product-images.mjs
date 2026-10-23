import fs from "node:fs/promises";
import path from "node:path";
import { browserbase } from "@browserbasehq/stagehand";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) throw new Error("BROWSERBASE_API_KEY is missing");

const outputDir = "C:/Users/mateo/OneDrive/Documentos/ChatGPT/NACHO/outputs/imagenes-amazon";
const items = [
  [183, "Reusch", "Attrakt Freegel Infinity"],
  [184, "Reusch", "Attrakt Infinity Finger Support"],
  [185, "Reusch", "Attrakt Solid"],
  [186, "Reusch", "Attrakt Pro Fusion Advance"],
  [187, "Reusch", "Attrakt Pro Aqua Advance"],
  [188, "Reusch", "Attrakt Pro Infinity"],
  [189, "Reusch", "Attrakt Supreme Infinity"],
  [194, "Reusch", "Fastgrip Fusion"],
  [195, "Reusch", "Attrakt Freegel Advance"],
  [196, "Reusch", "Fastgrip Prime Aqua"],
  [202, "Reusch", "Attrakt Solid Starter"],
  [203, "Reusch", "Attrakt Pro Fusion"],
  [204, "Reusch", "Fastgrip Infinity"],
  [236, "Uhlsport", "Powerline Absolutgrip"],
  [237, "Uhlsport", "Powerline Soft"],
  [238, "Uhlsport", "Starter Resist"],
  [241, "Uhlsport", "Powerline Starter Soft"],
  [291, "Adidas", "Copa goalkeeper gloves"],
  [292, "Adidas", "Predator goalkeeper gloves"],
];

const clean = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const terms = (value) => clean(value).split(" ").filter((term) => term.length > 2 && !["goalkeeper", "gloves"].includes(term));
await fs.mkdir(outputDir, { recursive: true });
const manifest = [];
for (const [row, brand, product] of items) {
  const results = await browserbase.search({ apiKey, query: `site:amazon.com ${brand} ${product}`, numResults: 5 });
  const wanted = [...terms(brand), ...terms(product)];
  const match = results.results.find((result) => {
    const title = clean(result.title);
    return wanted.every((term) => title.includes(term)) && /\/dp\/([A-Z0-9]{10})/.test(result.url);
  });
  if (!match) {
    manifest.push({ row, brand, product, status: "no exact Amazon match", amazonUrl: "", file: "" });
    continue;
  }
  const asin = match.url.match(/\/dp\/([A-Z0-9]{10})/)?.[1];
  const imageUrl = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok || !imageResponse.headers.get("content-type")?.startsWith("image/")) {
    manifest.push({ row, brand, product, status: "Amazon image unavailable", amazonUrl: match.url, file: "" });
    continue;
  }
  const file = `${String(row).padStart(3, "0")}-${brand}-${product}`.replace(/[^a-z0-9.-]+/gi, "-") + ".jpg";
  await fs.writeFile(path.join(outputDir, file), new Uint8Array(await imageResponse.arrayBuffer()));
  manifest.push({ row, brand, product, status: "downloaded", amazonUrl: match.url, file });
  console.log(`downloaded ${row} ${brand} ${product}`);
}
await fs.writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ downloaded: manifest.filter((item) => item.status === "downloaded").length, total: items.length }));
