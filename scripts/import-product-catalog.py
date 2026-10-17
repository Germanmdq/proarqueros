"""Extract the public catalog from Hoja1 without exporting private workbook tabs."""
import json
import re
import shutil
import sys
from pathlib import Path

import openpyxl

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
sheet = openpyxl.load_workbook(source, data_only=True, read_only=True)["Hoja1"]
products = []
section = ""
image_files = {5: "005-vgfc-basel.png", 6: "006-vgfc-imperio.png",
               7: "007-vgfc-rio.png", 8: "008-vgfc-moldes.png"}
image_dir = root / "public" / "images" / "products"
image_dir.mkdir(parents=True, exist_ok=True)

def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()

def category_for(name, row):
    if row >= 355:
        return "Calzado"
    if 294 <= row <= 309:
        return "Pelotas"
    if 163 <= row <= 167 or 312 <= row <= 334:
        return "Accesorios"
    if 337 <= row <= 353:
        return "Indumentaria"
    if re.search(r"TERMICA|MEDIAS|CONJUNTO|PANTALON|BERMUDA|CALZA|LYCRA|REMERA|MANGAS|BUZO|PARCK|PRINCES|SHORT", name):
        return "Indumentaria"
    return "Guantes"

def brand_for(section, name):
    for pattern, brand in [("VGFC", "VGFC"), ("LANUSCA", "Lanusca"), ("MUNICH", "Munich"),
                           ("HO SOCCER", "HO Soccer"), ("GLO", "Glo-Wpro"), ("PROSTAR", "Prostar"),
                           ("ALLY", "Ally Sport"), ("DRB", "DRB"), ("REEBOK", "Reebok"),
                           ("REUSCH", "Reusch"), ("SOLO PORTEROS", "Solo Porteros"), ("ELITE", "Elite"),
                           ("UHLSPORT", "Uhlsport"), ("N1", "N1"), ("CH1", "CH1"),
                           ("FITIPALDI", "Fitipaldi"), ("ADIDAS", "Adidas"), ("DREAMGOL", "Dreamgol"),
                           ("MB1", "MB1"), ("NASSAU", "Nassau"), ("ALFEST", "Alfest"),
                           ("KICK OFF", "Kick Off"), ("HALF SOCK", "Half Socks"), ("FOX", "Fox")]:
        if section in ("ACCESORIOS", "CANILLERAS", "INDUMENTARIA", "FOX", "CALZADO") and pattern in name:
            return brand
    for pattern, brand in [("VGFC", "VGFC"), ("LANUSCA", "Lanusca"), ("MUNICH", "Munich"),
                           ("HO SOCCER", "HO Soccer"), ("GLO", "Glo-Wpro"), ("PROSTAR", "Prostar"),
                           ("ALLY", "Ally Sport"), ("DRB", "DRB"), ("REEBOK", "Reebok"),
                           ("REUSCH", "Reusch"), ("SOLO PORTEROS", "Solo Porteros"), ("ELITE", "Elite"),
                           ("UHLSPORT", "Uhlsport"), ("N1", "N1"), ("CH1", "CH1"),
                           ("FITIPALDI", "Fitipaldi"), ("ADIDAS", "Adidas"), ("DREAMGOL", "Dreamgol"),
                           ("MB1", "MB1"), ("FOX", "Fox")]:
        if pattern in section:
            return brand
    return "Proarqueros"

for row, values in enumerate(sheet.iter_rows(values_only=True), start=1):
    name, price = clean(values[0]), values[4]
    if not name or row == 1:
        continue
    if not isinstance(price, (int, float)) or price <= 0:
        section = name
        continue
    category = category_for(name, row)
    brand = brand_for(section, name)
    audience = "Junior" if "JUNIOR" in section or " JR" in name else "Adulto"
    if category == "Guantes":
        options = [str(n) for n in range(4, 12)]
        label = "Talle a consultar"
        note = "Elegí el talle que buscás. Confirmamos la disponibilidad antes de la compra."
    elif category == "Indumentaria" and not re.search(r"MEDIAS|MANGAS", name):
        options = ["8", "10", "12", "14", "16"] if audience == "Junior" else ["S", "M", "L", "XL"]
        label = "Talle a consultar"
        note = "Elegí el talle que buscás. Confirmamos la disponibilidad antes de la compra."
    elif category == "Pelotas" and "NUMERO 4" in name:
        options, label, note = ["N.º 4"], "Número", "Modelo número 4. Color rojo indicado en la lista."
    else:
        options = ["A confirmar"]
        label = "Talle / número" if category in ("Calzado", "Indumentaria", "Pelotas") else "Presentación"
        note = "Consultanos las variantes y la disponibilidad de este modelo."
    color = next((value for token, value in [("TOTAL BLACK", "Negro"), ("BLACK", "Negro"),
                  ("ORANGE", "Naranja"), ("YELLOW", "Amarillo"), ("WHITE", "Blanco"),
                  ("BLANCO", "Blanco"), ("NEGRO", "Negro"), ("ROJA", "Rojo")]
                  if token in name), None)
    filename = image_files.get(row, list(image_files.values())[len(products) % len(image_files)])
    original = root / "outputs" / "productos-verificados" / "imagenes" / filename
    if original.exists():
        shutil.copy2(original, image_dir / filename)
    elif not (image_dir / filename).exists():
        raise FileNotFoundError(f"Missing catalog image: {filename}")
    image = f"/images/products/{filename}"
    products.append({"id": f"pro-{row:03d}", "sourceRow": row, "name": name, "brand": brand,
                     "section": section, "category": category, "audience": audience,
                     "price": price, "price3Installments": values[2], "price6Installments": values[3],
                     "description": f"{category} {brand}, modelo {name}. Línea {audience.lower()}." if category in ("Guantes", "Indumentaria") else f"{category}: {name}. {brand}.",
                     "image": image, "isReferenceImage": row not in image_files, "stock": 8,
                     "color": color, "variantLabel": label, "variantNote": note,
                     "variants": [{"id": f"pro-{row:03d}-{index}", "label": option} for index, option in enumerate(options)]})

assert len(products) == 198, f"Catalog source changed: {len(products)} products"
assert len({p["id"] for p in products}) == len(products)
target = root / "src" / "data" / "products.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"products": len(products), "variants": sum(len(p["variants"]) for p in products),
                  "images": sum(bool(p["image"]) for p in products),
                  "categories": {c: sum(p["category"] == c for p in products) for c in sorted({p["category"] for p in products})}}, ensure_ascii=False))
