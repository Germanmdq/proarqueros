"""Import Rinat Argentina's public catalogue and original product galleries.

Only public sitemap/product HTML and observed CDN images are requested. No cart,
account or checkout endpoints are called. Existing spreadsheet data is untouched.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import re
import time
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.rinatargentina.ar/"
ASSETS = ROOT / "public/sites/rinat/products"
EVIDENCE = ROOT / "docs/research/rinat"
CACHE = ROOT / "outputs/rinat-cache"
USE_CACHE = True


class Node:
    def __init__(self, tag="root", attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def all(self, predicate):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if predicate(child):
                    result.append(child)
                result.extend(child.all(predicate))
        return result

    def text(self):
        return " ".join(child.text() if isinstance(child, Node) else child for child in self.children)

    def has_class(self, name):
        return name in self.attrs.get("class", "").split()


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def clean(value):
    return re.sub(r"\s+", " ", value).strip()


def request(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "Proarquero catalog import (public product data)", "Accept": "*/*"}), timeout=45) as response:
                return response.read(), response.headers.get_content_type()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def read_page(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    filename = CACHE / (urlparse(url).path.strip("/").replace("/", "_") or "home")
    filename = filename.with_suffix(".html")
    if not USE_CACHE or not filename.exists():
        data, content_type = request(url)
        assert content_type in {"text/html", "application/xhtml+xml"}, (url, content_type)
        filename.write_bytes(data)
    return Document(filename.read_text(encoding="utf-8")).root


def inspect(url):
    root = read_page(url)
    container = root.all(lambda n: n.attrs.get("id") == "single-product-container")[0]
    variants = json.loads(container.attrs["data-variants"])
    print(json.dumps(variants[:2], ensure_ascii=False, indent=2))
    print("Combinations:", len(variants))
    print("Options:", [n.attrs for n in container.all(lambda n: "data-variant" in n.attrs)])


def extract_product(url):
    root = read_page(url)
    container = root.all(lambda n: n.attrs.get("id") == "single-product-container")[0]
    source_variants = json.loads(container.attrs["data-variants"])
    assert source_variants, url
    name = clean(container.all(lambda n: n.tag == "h1")[0].text())
    product_id = source_variants[0]["product_id"]
    option_names = [n.attrs["data-variant"] for n in container.all(lambda n: "data-variant" in n.attrs)]
    galleries = []
    for node in container.all(lambda n: n.has_class("js-product-slide") and "data-zoom-url" in n.attrs):
        galleries.append({"id": node.attrs["data-image"], "url": urljoin(BASE, node.attrs["data-zoom-url"])})
    gallery_by_id = {image["id"]: image for image in galleries}
    variants = []
    for variant in source_variants:
        values = {key: variant.get(f"option{index}") for index, key in enumerate(option_names)}
        values = {key: value for key, value in values.items() if value}
        image_id = str(variant.get("image"))
        if variant.get("image_url") and image_id not in gallery_by_id:
            image = {"id": image_id, "url": urljoin(BASE, variant["image_url"])}
            galleries.append(image)
            gallery_by_id[image_id] = image
        variants.append({
            "id": f"rinat-v-{variant['id']}",
            "label": " · ".join(f"{key} {value}" for key, value in values.items()) or "Única",
            "color": values.get("Color"), "size": values.get("Talle"),
            "options": values, "imageId": image_id,
            "price": variant["price_number"], "sku": variant.get("sku"),
            "sourceStock": variant.get("stock"), "sourceAvailable": variant.get("available", False),
        })
    assert galleries, (url, "missing gallery")
    # Keep source order, deduplicating images by their Tiendanube identifier.
    galleries = list({image["id"]: image for image in galleries}.values())
    descriptions = container.all(lambda n: n.has_class("product-description"))
    description = clean(descriptions[0].text()) if descriptions else ""
    breadcrumb = root.all(lambda n: n.has_class("breadcrumb"))
    breadcrumb_text = clean(breadcrumb[0].text()) if breadcrumb else ""
    if "Guantes" in breadcrumb_text:
        category = "Guantes"
    elif "Indumentaria" in breadcrumb_text:
        category = "Indumentaria"
    elif "Accesorios" in breadcrumb_text:
        category = "Pelotas" if "pelota" in name.lower() else "Accesorios"
    else:
        raise ValueError(f"Unrecognized category breadcrumb: {url}: {breadcrumb_text}")
    colors = list(dict.fromkeys(v["color"] for v in variants if v["color"]))
    # Preserve public payment details as evidence; own shop payments are confirmed separately.
    installments = json.loads(source_variants[0].get("installments_data") or "{}")
    free_installments = sorted({int(count) for provider in installments.values() for count, plan in provider.items() if plan.get("without_interests")})
    return {
        "id": f"rinat-{product_id}", "sourceRow": 0, "sourceUrl": url,
        "name": name, "brand": "Rinat", "section": f"RINAT {category.upper()}", "category": category,
        "audience": "Junior" if re.search(r"infantil|junior|niñ", name, re.I) else "Adulto",
        "price": min(v["price"] for v in variants), "price3Installments": None, "price6Installments": None,
        "description": description, "isReferenceImage": False, "stock": 8,
        "color": colors[0] if len(colors) == 1 else None, "colors": colors,
        "variantLabel": "Color y talle" if len(option_names) > 1 else (option_names[0] if option_names else "Variante"),
        "variantNote": "Colores y talles publicados por Rinat Argentina. Disponibilidad sujeta a confirmación.",
        "variants": variants, "gallerySource": galleries,
        "sourceInstallments": free_installments,
    }


def download_image(job):
    product_id, image = job
    directory = ASSETS / product_id
    directory.mkdir(parents=True, exist_ok=True)
    suffix = Path(urlparse(image["url"]).path).suffix.lower()
    assert suffix in {".webp", ".jpg", ".jpeg", ".png", ".avif"}, image
    target = directory / f"{image['id']}{suffix}"
    if not target.exists():
        data, mime = request(image["url"])
        assert mime.startswith("image/"), (image["url"], mime)
        with Image.open(BytesIO(data)) as bitmap:
            bitmap.verify()
        target.write_bytes(data)
    with Image.open(target) as bitmap:
        width, height = bitmap.size
    return {"productId": product_id, "imageId": image["id"], "sourceUrl": image["url"],
            "localPath": "/" + target.relative_to(ROOT / "public").as_posix(),
            "width": width, "height": height, "bytes": target.stat().st_size}


def main():
    data, _ = request(urljoin(BASE, "sitemap.xml"))
    sitemap = ET.fromstring(data)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = sorted({node.text for node in sitemap.findall("s:url/s:loc", ns) if re.match(r"https://www\.rinatargentina\.ar/productos/[^/]+/$", node.text or "")})
    # Cross-check every observed pagination link, not just the home-page highlights.
    catalogue = read_page(urljoin(BASE, "productos/"))
    pages = {BASE + "productos/"} | {urljoin(BASE, n.attrs["href"]) for n in catalogue.all(lambda n: n.tag == "a" and re.search(r"/productos/page/\d+/", n.attrs.get("href", "")))}
    listed = set()
    for page in sorted(pages):
        root = read_page(page)
        listed.update(n.attrs["href"] for n in root.all(lambda n: n.tag == "a" and re.match(r"https://www\.rinatargentina\.ar/productos/[^/]+/$", n.attrs.get("href", ""))))
    urls = sorted(set(urls) | listed)
    print(f"Found {len(urls)} products across {len(pages)} catalogue pages", flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        products = list(pool.map(extract_product, urls))
    products.sort(key=lambda p: (-int(p["id"].split("-")[1]), p["name"]))
    for index, product in enumerate(products):
        product["sourceRow"] = -len(products) + index
    jobs = [(product["id"], image) for product in products for image in product["gallerySource"]]
    with ThreadPoolExecutor(max_workers=6) as pool:
        assets = []
        for index, asset in enumerate(pool.map(download_image, jobs), 1):
            assets.append(asset)
            if index % 20 == 0:
                print(f"Downloaded and checked {index}/{len(jobs)} images", flush=True)
    paths = {(a["productId"], a["imageId"]): a for a in assets}
    for product in products:
        product["images"] = [{"id": image["id"], "src": paths[(product["id"], image["id"])]["localPath"], "alt": f"Rinat {product['name']} · foto {i + 1}"} for i, image in enumerate(product.pop("gallerySource"))]
        product["image"] = product["images"][0]["src"]
        for variant in product["variants"]:
            asset = paths.get((product["id"], variant.pop("imageId")))
            variant["image"] = asset["localPath"] if asset else product["image"]
    assert len(products) == len(urls) and len({p["id"] for p in products}) == len(products)
    assert all(p["images"] and p["variants"] for p in products)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (ROOT / "src/data/rinat-products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    report = {"source": BASE, "retrievedAt": datetime.now(timezone.utc).isoformat(), "cataloguePages": sorted(pages), "sitemapProducts": len(urls), "listedProducts": len(listed), "products": len(products), "variants": sum(len(p["variants"]) for p in products), "images": len(assets), "assets": assets}
    (EVIDENCE / "asset-map.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps({key: value for key, value in report.items() if key != "assets"}, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect")
    parser.add_argument("--refresh", action="store_true", help="Fetch fresh public HTML instead of using the local cache")
    args = parser.parse_args()
    USE_CACHE = not args.refresh
    if args.inspect:
        inspect(args.inspect)
    else:
        main()
