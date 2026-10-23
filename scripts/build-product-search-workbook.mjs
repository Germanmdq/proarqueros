import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/mateo/Downloads/LISTA PROARQUEROS PRODUCTOS oct 2024.xlsx";
const outputDir = "C:/Users/mateo/OneDrive/Documentos/ChatGPT/NACHO/outputs/productos-buscados";
const outputPath = `${outputDir}/productos_con_busqueda.xlsx`;

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

const verified = new Map([
  ["VGFC|AXUM LEGEND", {
    description: "Guante profesional para arquero con corte híbrido Roll y palma Contact Látex de 4 mm.",
    image: "https://www.dongool.com.ar/productos/productos-guantes-arquero-vgfc-axum-legend/",
    source: "https://www.dongool.com.ar/productos/productos-guantes-arquero-vgfc-axum-legend/",
  }],
  ["Reusch|ATTRAKT FREEGEL INFINITY", {
    description: "Guante para césped artificial con palma Reusch Grip Infinity, dorso Freegel y corte Evolution Negative.",
    image: "https://www.prosoccer.com/cdn/shop/files/reusch-attrakt-freegel-infinity-goalkeeper-gloves-7097920.webp?v=1767647903",
    source: "https://www.reusch.com/en/attrakt-freegel-infinity-p21885/",
  }],
]);

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const url = (query, image = false) =>
  `https://www.google.com/search?${image ? "tbm=isch&" : ""}q=${encodeURIComponent(query)}`;

const productKind = (row, brand, product) => {
  if (row >= 294 && row <= 309) return "Pelota de fútbol";
  if ((row >= 312 && row <= 334) || /CANILLERA|CINTA|INFLADOR|BOLSO|JABON|ADHERENTE|HIDRATANTE|LATEX|NEUTRALIZADOR|CREMA/i.test(product)) return "Accesorio para arquero";
  if (row >= 337) return "Indumentaria o calzado";
  if (/TERMICA|MEDIAS|CONJUNTO|PANTALON|BERMUDA|CALZA|LYCRA|REMERA|MANGAS|BUZO|PARK|PARCK|SHORT/i.test(product)) return "Indumentaria para arquero";
  return "Guante de arquero";
};

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sourceSheet = workbook.worksheets.getItem("Hoja1");
const sourceValues = sourceSheet.getRange("A1:P357").values;
const sheet = workbook.worksheets.add("Resultados web");

const rows = [];
for (let index = 1; index < sourceValues.length; index += 1) {
  const excelRow = index + 1;
  const name = sourceValues[index][0];
  const cashPrice = sourceValues[index][4];
  if (typeof name !== "string" || !name.trim() || !isFiniteNumber(cashPrice) || cashPrice <= 0) continue;
  const [, , brand] = brandRanges.find(([start, end]) => excelRow >= start && excelRow <= end) ?? [0, 0, "Sin marca identificada"];
  const product = name.trim();
  const match = verified.get(`${brand}|${product}`);
  const kind = productKind(excelRow, brand, product);
  const query = `${brand} ${product} ${kind}`;
  rows.push([
    excelRow,
    brand,
    product,
    kind,
    match?.description ?? `${kind} ${brand}, modelo ${product}.`,
    match?.image ?? url(query, true),
    match?.source ?? url(query),
    match ? "Verificado" : "Buscar y validar ficha",
  ]);
}

sheet.getRange("A1:H1").values = [[
  "Fila origen", "Marca", "Producto", "Tipo", "Descripción", "Imagen", "Fuente", "Estado",
]];
sheet.getRange(`A2:H${rows.length + 1}`).values = rows;
sheet.getRange(`F2:F${rows.length + 1}`).formulas = rows.map((row, index) => [
  `=HYPERLINK("${row[5]}","Ver imagen")`,
]);
sheet.getRange(`G2:G${rows.length + 1}`).formulas = rows.map((row) => [
  `=HYPERLINK("${row[6]}","Abrir ficha")`,
]);

sheet.getRange("A1:H1").format = {
  fill: "#12344D",
  font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
sheet.getRange(`A2:H${rows.length + 1}`).format.font = { name: "Arial", size: 10, color: "#1F2937" };
sheet.getRange(`A2:H${rows.length + 1}`).format.verticalAlignment = "center";
sheet.getRange(`A2:H${rows.length + 1}`).format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };
sheet.getRange(`A2:H${rows.length + 1}`).format.wrapText = true;
sheet.getRange(`H2:H${rows.length + 1}`).conditionalFormats.add("containsText", {
  text: "Verificado",
  format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } },
});
sheet.getRange(`H2:H${rows.length + 1}`).conditionalFormats.add("containsText", {
  text: "Buscar y validar ficha",
  format: { fill: "#FEF3C7", font: { color: "#92400E" } },
});
sheet.getRange("A:A").format.columnWidth = 11;
sheet.getRange("B:B").format.columnWidth = 18;
sheet.getRange("C:C").format.columnWidth = 34;
sheet.getRange("D:D").format.columnWidth = 22;
sheet.getRange("E:E").format.columnWidth = 60;
sheet.getRange("F:G").format.columnWidth = 18;
sheet.getRange("H:H").format.columnWidth = 24;
sheet.getRange("A1:H1").format.rowHeight = 28;
sheet.getRange(`A2:H${rows.length + 1}`).format.rowHeight = 34;
sheet.freezePanes.freezeRows(1);
sheet.showGridLines = false;
sheet.tables.add(`A1:H${rows.length + 1}`, true, "ResultadosWeb");

workbook.recalculate();
const check = await workbook.inspect({
  kind: "table",
  range: "Resultados web!A1:H12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 8,
});
console.log(check.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 50 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
const preview = await workbook.render({ sheetName: "Resultados web", range: "A1:H20", scale: 1 });
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, rows: rows.length }));
