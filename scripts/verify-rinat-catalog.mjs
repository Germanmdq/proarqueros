import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (name) => JSON.parse(await readFile(path.join(root, name), "utf8"));
const products = await readJson("src/data/rinat-products.json");
const original = await readJson("src/data/products.json");
const manifest = await readJson("docs/research/rinat/asset-map.json");
assert.equal(products.length, manifest.products);
assert.equal(products.length, 37);
assert.equal(original.length, 198);
assert.equal(new Set([...products, ...original].map((product) => product.id)).size, 235);
assert.equal(products.flatMap((product) => product.variants).length, 202);
assert.equal(manifest.assets.length, 188);

for (const product of products) {
  assert.equal(product.stock, 8);
  assert.equal(product.brand, "Rinat");
  assert.equal(product.isReferenceImage, false);
  assert(product.description.length > 30);
  assert(product.images.length > 0);
  assert(["Guantes", "Pelotas", "Indumentaria", "Accesorios"].includes(product.category));
  for (const image of product.images) {
    await access(path.join(root, "public", image.src));
    assert(manifest.assets.some((asset) => asset.productId === product.id && asset.localPath === image.src && asset.width > 0 && asset.height > 0));
  }
  assert.equal(new Set(product.variants.map((variant) => variant.id)).size, product.variants.length);
  for (const variant of product.variants) {
    assert(variant.price > 0);
    assert(product.images.some((image) => image.src === variant.image));
    if (variant.color) assert(product.colors.includes(variant.color));
    assert.equal(typeof variant.sourceAvailable, "boolean");
  }
}
console.log("Verified: 235 products total; 37 Rinat products, 202 original combinations and 188 local photos.");
