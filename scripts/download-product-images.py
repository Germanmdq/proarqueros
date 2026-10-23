"""Download one candidate product image per catalog row from Bing Images."""

from __future__ import annotations

import csv
import html
import json
import re
import time
from pathlib import Path
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

import pandas as pd

WORKBOOK = Path(r"C:\Users\mateo\OneDrive\Documentos\ChatGPT\NACHO\outputs\productos-buscados\productos_con_busqueda.xlsx")
IMAGES_DIR = WORKBOOK.parent / "imagenes"
MANIFEST = IMAGES_DIR / "manifest.csv"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"}


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    return cleaned.strip("-.")[:100] or "producto"


def fetch(url: str, timeout: int = 20) -> tuple[bytes, str]:
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers.get_content_type()


def find_image_url(query: str) -> str | None:
    page, _ = fetch(f"https://www.bing.com/images/search?q={quote_plus(query)}&form=HDRSC2")
    text = html.unescape(page.decode("utf-8", errors="ignore"))
    matches = re.findall(r'"murl":"(.*?)"', text)
    for match in matches:
        candidate = html.unescape(match.replace("\\/", "/"))
        if candidate.startswith("https://") or candidate.startswith("http://"):
            return candidate
    return None


def extension(content_type: str, image_url: str) -> str:
    normalized = content_type.lower()
    if "png" in normalized:
        return ".png"
    if "webp" in normalized:
        return ".webp"
    if "gif" in normalized:
        return ".gif"
    if "jpeg" in normalized or "jpg" in normalized:
        return ".jpg"
    suffix = Path(image_url.split("?", 1)[0]).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"


def main() -> None:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    data = pd.read_excel(WORKBOOK, sheet_name="Resultados web")
    records: list[dict[str, str]] = []
    for _, item in data.iterrows():
        source_row = int(item["Fila origen"])
        brand = str(item["Marca"]).strip()
        product = str(item["Producto"]).strip()
        kind = str(item["Tipo"]).strip()
        filename_prefix = f"{source_row:03d}-{safe_name(brand)}-{safe_name(product)}"
        existing = list(IMAGES_DIR.glob(f"{filename_prefix}.*"))
        if existing:
            records.append({"fila_origen": str(source_row), "marca": brand, "producto": product, "archivo": existing[0].name, "url_imagen": "preexistente", "estado": "descargada"})
            continue
        query = f"{brand} {product} {kind}"
        image_url = ""
        try:
            image_url = find_image_url(query) or ""
            if not image_url:
                raise RuntimeError("sin resultados de imagen")
            content, content_type = fetch(image_url)
            if not content or not content_type.startswith("image/"):
                raise RuntimeError(f"respuesta no válida: {content_type}")
            output = IMAGES_DIR / f"{filename_prefix}{extension(content_type, image_url)}"
            output.write_bytes(content)
            records.append({"fila_origen": str(source_row), "marca": brand, "producto": product, "archivo": output.name, "url_imagen": image_url, "estado": "descargada"})
        except Exception as error:  # Download failures must not stop later products.
            records.append({"fila_origen": str(source_row), "marca": brand, "producto": product, "archivo": "", "url_imagen": image_url, "estado": f"sin descarga: {str(error)[:120]}"})
        if len(records) % 10 == 0:
            print(f"procesados={len(records)}", flush=True)
        time.sleep(0.2)

    with MANIFEST.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=["fila_origen", "marca", "producto", "archivo", "url_imagen", "estado"])
        writer.writeheader()
        writer.writerows(records)
    success = sum(record["estado"] == "descargada" for record in records)
    print(json.dumps({"productos": len(records), "descargadas": success, "manifest": str(MANIFEST)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
